import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";

type Params = { params: Promise<{ id: string; stallId: string; memberId: string }> };

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

// DELETE /api/plan/[id]/stalls/[stallId]/members/[memberId] — memberId = StallMember.id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, stallId, memberId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!access.permissions.canManageStalls) {
      return NextResponse.json({ error: "You don't have permission to manage stall members" }, { status: 403 });
    }

    const stallMember = await prisma.stallMember.findFirst({
      where: { id: memberId, stallId },
      include: { stall: { select: { workItemId: true } } },
    });
    if (!stallMember || stallMember.stall.workItemId !== planId) {
      return NextResponse.json({ error: "Stall member not found" }, { status: 404 });
    }

    await prisma.stallMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /stalls/:id/members/:memberId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}