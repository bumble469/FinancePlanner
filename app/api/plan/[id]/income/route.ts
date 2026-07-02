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

function canMutateIncome(access: NonNullable<Awaited<ReturnType<typeof resolveAccess>>>, action: "create" | "edit" | "delete"): boolean {
  if (access.isOwner || access.role === "ADMIN") return true;
  if (access.role === "MEMBER") return false;
  if (access.role === "CO_ADMIN") return !!access.permissions?.revenue?.[action];
  if (access.role === "MANAGER") return access.permissions?.revenue === "MANAGE";
  if (access.role === "CO_MANAGER") return access.permissions?.revenue === "MANAGE";
  return false;
}

// GET /api/plan/[id]/income — all members can view income
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;

    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const income = await prisma.income.findMany({
      where: { workItemId: planId },
      include: { phase: { select: { id: true, name: true } } },
      orderBy: { receivedAt: "desc" },
    });

    const formatted = income.map((i) => ({
      ...i,
      amount: Number(i.amount),
      phaseName: i.phase?.name ?? null,
      receivedAt: i.receivedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error("[GET /income]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/plan/[id]/income — create income entry
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;

    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!canMutateIncome(access, "create")) {
      return NextResponse.json({ error: "You don't have permission to add income" }, { status: 403 });
    }

    const body = await req.json();
    const { type, amount, source, description, phaseId, receivedAt } = body;

    if (!type || !["INVESTMENT", "REVENUE"].includes(type)) {
      return NextResponse.json({ error: "Invalid income type" }, { status: 400 });
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!source?.trim()) {
      return NextResponse.json({ error: "Source is required" }, { status: 400 });
    }

    // validate phaseId belongs to this plan
    if (phaseId) {
      const phase = await prisma.phase.findFirst({ where: { id: phaseId, workItemId: planId } });
      if (!phase) return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
    }

    const income = await prisma.income.create({
      data: {
        workItemId: planId,
        type,
        amount: Number(amount),
        source: source.trim(),
        description: description?.trim() || null,
        phaseId: phaseId || null,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      },
      include: { phase: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...income,
        amount: Number(income.amount),
        phaseName: income.phase?.name ?? null,
        receivedAt: income.receivedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /income]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}