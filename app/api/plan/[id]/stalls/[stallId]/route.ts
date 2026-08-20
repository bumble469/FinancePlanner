import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";

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

// PATCH /api/plan/[id]/stalls/[stallId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, stallId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!access.permissions.canManageStalls) {
      return NextResponse.json({ error: "You don't have permission to edit stalls" }, { status: 403 });
    }

    const stall = await prisma.stall.findFirst({ where: { id: stallId, workItemId: planId } });
    if (!stall) return NextResponse.json({ error: "Stall not found" }, { status: 404 });

    const body = await req.json();
    const { name, description } = body;

    const updated = await prisma.stall.update({
      where: { id: stallId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /stalls/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/plan/[id]/stalls/[stallId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, stallId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!access.permissions.canManageStalls) {
      return NextResponse.json({ error: "You don't have permission to delete stalls" }, { status: 403 });
    }

    const stall = await prisma.stall.findFirst({ where: { id: stallId, workItemId: planId } });
    if (!stall) return NextResponse.json({ error: "Stall not found" }, { status: 404 });

    // Income/Expense rows tagged to this stall keep existing via onDelete: SetNull —
    // deleting a stall never deletes financial history, just untags it.
    await prisma.stall.delete({ where: { id: stallId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /stalls/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}