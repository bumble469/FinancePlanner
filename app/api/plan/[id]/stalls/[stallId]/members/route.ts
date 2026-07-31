import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string; stallId: string }> };

async function resolveAccess(planId: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { userId } });
  const isOwner = account
    ? !!(await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } }))
    : false;
  if (isOwner) return { isOwner: true, role: "OWNER" as const };

  const member = await prisma.workItemMember.findFirst({ where: { workItemId: planId, userId } });
  if (!member) return null;
  return { isOwner: false, role: member.role };
}

function canManageStalls(access: { isOwner: boolean; role: string }): boolean {
  return access.isOwner || access.role === "ADMIN" || access.role === "CO_ADMIN";
}

// POST /api/plan/[id]/stalls/[stallId]/members — add an existing plan member to a stall
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, stallId } = await params;
    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!canManageStalls(access)) {
      return NextResponse.json({ error: "You don't have permission to manage stall members" }, { status: 403 });
    }

    const stall = await prisma.stall.findFirst({ where: { id: stallId, workItemId: planId } });
    if (!stall) return NextResponse.json({ error: "Stall not found" }, { status: 404 });

    const body = await req.json();
    const { workItemMemberId } = body;
    if (!workItemMemberId) {
      return NextResponse.json({ error: "workItemMemberId is required" }, { status: 400 });
    }

    const workItemMember = await prisma.workItemMember.findFirst({
      where: { id: workItemMemberId, workItemId: planId },
    });
    if (!workItemMember) {
      return NextResponse.json({ error: "That person is not a member of this plan" }, { status: 400 });
    }

    const existing = await prisma.stallMember.findUnique({
      where: { stallId_userId: { stallId, userId: workItemMember.userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "This member is already assigned to the stall" }, { status: 409 });
    }

    const stallMember = await prisma.stallMember.create({
      data: {
        stallId,
        userId: workItemMember.userId,
        workItemMemberId: workItemMember.id,
      },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json({ success: true, data: stallMember }, { status: 201 });
  } catch (err) {
    console.error("[POST /stalls/:id/members]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}