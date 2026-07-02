import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

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

function canCreateExpense(access: NonNullable<Awaited<ReturnType<typeof resolveAccess>>>, deptId?: string): boolean {
  if (access.isOwner || access.role === "ADMIN") return true;
  if (access.role === "MEMBER") return false;
  if (access.role === "CO_ADMIN") return !!access.permissions?.expenses?.create;
  if (access.role === "MANAGER" || access.role === "CO_MANAGER") {
    if (access.permissions?.expenses !== "MANAGE") return false;
    if (deptId && !access.deptIds.includes(deptId)) return false;
    return true;
  }
  return false;
}

// GET /api/plan/[id]/expenses
// OWNER/ADMIN/CO_ADMIN → all expenses
// MANAGER/CO_MANAGER/MEMBER → only their dept's expenses
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;

    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const isRestricted = !access.isOwner && !["ADMIN", "CO_ADMIN"].includes(access.role);

    const expenses = await prisma.expense.findMany({
      where: {
        phase: { workItemId: planId },
        ...(isRestricted && access.deptIds.length > 0
          ? { departmentId: { in: access.deptIds } }
          : {}),
      },
      include: {
        phase: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { occurredAt: "desc" },
    });

    // Also fetch expenses not linked to a phase (direct workItem expenses via departmentId)
    // The Expense model links via phaseId OR departmentId, not workItemId directly
    // So we need a second query for dept-only expenses with no phase
    const deptOnlyExpenses = await prisma.expense.findMany({
      where: {
        phaseId: null,
        departmentId: isRestricted && access.deptIds.length > 0
          ? { in: access.deptIds }
          : { not: undefined },
        department: { workItemId: planId },
      },
      include: {
        phase: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { occurredAt: "desc" },
    });

    // merge and dedupe
    const seen = new Set<string>();
    const all = [...expenses, ...deptOnlyExpenses].filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    const formatted = all.map((e) => ({
      ...e,
      amount: Number(e.amount),
      phaseName: e.phase?.name ?? null,
      departmentName: e.department?.name ?? null,
      occurredAt: e.occurredAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error("[GET /expenses]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/plan/[id]/expenses
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;

    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { category, amount, description, phaseId, departmentId, occurredAt } = body;

    if (!canCreateExpense(access, departmentId)) {
      return NextResponse.json({ error: "You don't have permission to add expenses" }, { status: 403 });
    }

    const validCategories = ["SALARY", "MARKETING", "TOOLS", "OPERATIONS", "EVENT", "OTHER"];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (phaseId) {
      const phase = await prisma.phase.findFirst({ where: { id: phaseId, workItemId: planId } });
      if (!phase) return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
    }
    if (departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: departmentId, workItemId: planId } });
      if (!dept) return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        workItemId: planId,
        category,
        amount: Number(amount),
        description: description?.trim() || null,
        phaseId: phaseId || null,
        departmentId: departmentId || null,
        loggedById: user.sub,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      },
      include: {
        phase: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...expense,
        amount: Number(expense.amount),
        phaseName: expense.phase?.name ?? null,
        departmentName: expense.department?.name ?? null,
        occurredAt: expense.occurredAt.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /expenses]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}