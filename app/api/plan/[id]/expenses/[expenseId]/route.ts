import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string; expenseId: string }> };

async function resolveAccess(planId: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { userId } });
  const isOwner = account
    ? !!(await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } }))
    : false;

  if (isOwner) return { isOwner: true, role: "OWNER" as const, permissions: null, deptIds: [] as string[] };

  const member = await prisma.workItemMember.findFirst({
    where: { workItemId: planId, userId },
    include: { departmentMembers: { select: { departmentId: true } } },
  });

  if (!member) return null;

  return {
    isOwner: false,
    role: member.role,
    permissions: member.permissions as any,
    deptIds: member.departmentMembers.map((d) => d.departmentId),
  };
}

function canMutateExpense(
  access: NonNullable<Awaited<ReturnType<typeof resolveAccess>>>,
  action: "edit" | "delete",
  deptId?: string | null
): boolean {
  if (access.isOwner || access.role === "ADMIN") return true;
  if (access.role === "MEMBER") return false;
  if (access.role === "CO_ADMIN") return !!access.permissions?.expenses?.[action];
  if (access.role === "MANAGER" || access.role === "CO_MANAGER") {
    if (access.permissions?.expenses !== "MANAGE") return false;
    if (deptId && !access.deptIds.includes(deptId)) return false;
    return true;
  }
  return false;
}

// PATCH /api/plan/[id]/expenses/[expenseId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, expenseId } = await params;

    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        OR: [
          { phase: { workItemId: planId } },
          { department: { workItemId: planId } },
        ],
      },
    });
    if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    if (!canMutateExpense(access, "edit", existing.departmentId)) {
      return NextResponse.json({ error: "You don't have permission to edit this expense" }, { status: 403 });
    }

    const body = await req.json();
    const { category, amount, description, phaseId, departmentId, occurredAt } = body;

    if (phaseId) {
      const phase = await prisma.phase.findFirst({ where: { id: phaseId, workItemId: planId } });
      if (!phase) return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
    }
    if (departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: departmentId, workItemId: planId } });
      if (!dept) return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(category ? { category } : {}),
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(phaseId !== undefined ? { phaseId: phaseId || null } : {}),
        ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
        ...(occurredAt !== undefined ? { occurredAt: new Date(occurredAt) } : {}),
      },
      include: {
        phase: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        amount: Number(updated.amount),
        phaseName: updated.phase?.name ?? null,
        departmentName: updated.department?.name ?? null,
        occurredAt: updated.occurredAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[PATCH /expenses/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/plan/[id]/expenses/[expenseId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, expenseId } = await params;

    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        OR: [
          { phase: { workItemId: planId } },
          { department: { workItemId: planId } },
        ],
      },
    });
    if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    if (!canMutateExpense(access, "delete", existing.departmentId)) {
      return NextResponse.json({ error: "You don't have permission to delete this expense" }, { status: 403 });
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /expenses/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}