import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";

type Params = { params: Promise<{ id: string; ticketTypeId: string }> };

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

function canManageTicketing(access: { isOwner: boolean; role: string }): boolean {
  return access.isOwner || access.role === "ADMIN" || access.role === "CO_ADMIN";
}

// PATCH /api/plan/[id]/ticket-types/[ticketTypeId]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, ticketTypeId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!access.permissions.canManageTicketing) {
      return NextResponse.json({ error: "You don't have permission to manage ticket types" }, { status: 403 });
    }

    const ticketType = await prisma.ticketType.findFirst({ where: { id: ticketTypeId, workItemId: planId } });
    if (!ticketType) return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });

    const body = await req.json();
    const { name, price, capacity, salesStart, salesEnd, description, isActive } = body;

    const updated = await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(capacity !== undefined ? { capacity: capacity === null ? null : Number(capacity) } : {}),
        ...(salesStart !== undefined ? { salesStart: salesStart ? new Date(salesStart) : null } : {}),
        ...(salesEnd !== undefined ? { salesEnd: salesEnd ? new Date(salesEnd) : null } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(isActive !== undefined ? { isActive: !!isActive } : {}),
      },
    });

    return NextResponse.json({ success: true, data: { ...updated, price: Number(updated.price) } });
  } catch (err) {
    console.error("[PATCH /ticket-types/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/plan/[id]/ticket-types/[ticketTypeId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, ticketTypeId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!access.permissions.canManageTicketing) {
      return NextResponse.json({ error: "You don't have permission to manage ticket types" }, { status: 403 });
    }

    const ticketType = await prisma.ticketType.findFirst({ where: { id: ticketTypeId, workItemId: planId } });
    if (!ticketType) return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });

    const bookingCount = await prisma.ticketBooking.count({ where: { ticketTypeId } });
    if (bookingCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a ticket type with existing bookings. Deactivate it instead." },
        { status: 409 }
      );
    }

    await prisma.ticketType.delete({ where: { id: ticketTypeId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /ticket-types/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}