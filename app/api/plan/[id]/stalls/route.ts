import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

async function resolveAccess(planId: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { userId } });
  const isOwner = account
    ? !!(await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } }))
    : false;

  if (isOwner) return { isOwner: true, role: "OWNER" as const, permissions: null, memberId: null as string | null };

  const member = await prisma.workItemMember.findFirst({ where: { workItemId: planId, userId } });
  if (!member) return null;

  return {
    isOwner: false,
    role: member.role,
    permissions: member.permissions as any,
    memberId: member.id as string | null,
  };
}

function canManageStalls(access: NonNullable<Awaited<ReturnType<typeof resolveAccess>>>): boolean {
  return access.isOwner || access.role === "ADMIN" || access.role === "CO_ADMIN";
}

// GET /api/plan/[id]/stalls — all members can view
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;
    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const stalls = await prisma.stall.findMany({
      where: { workItemId: planId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        _count: { select: { income: true, expenses: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: stalls });
  } catch (err) {
    console.error("[GET /stalls]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/plan/[id]/stalls
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;
    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!canManageStalls(access)) {
      return NextResponse.json({ error: "You don't have permission to add stalls" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Stall name is required" }, { status: 400 });
    }

    const existing = await prisma.stall.findUnique({
      where: { workItemId_name: { workItemId: planId, name: name.trim() } },
    });
    if (existing) {
      return NextResponse.json({ error: "A stall with this name already exists" }, { status: 409 });
    }

    const stall = await prisma.stall.create({
      data: { workItemId: planId, name: name.trim(), description: description?.trim() || null },
    });

    return NextResponse.json({ success: true, data: stall }, { status: 201 });
  } catch (err) {
    console.error("[POST /stalls]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}