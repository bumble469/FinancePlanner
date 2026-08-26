import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";

type Params = { params: Promise<{ id: string; bookingId: string }> };

// PATCH /api/plan/[id]/ticket-bookings/[bookingId] — cancel a booking or update payment status
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, bookingId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!access.permissions.canManageTicketing) {
      return NextResponse.json({ error: "You don't have permission to manage bookings" }, { status: 403 });
    }

    const booking = await prisma.ticketBooking.findFirst({ where: { id: bookingId, workItemId: planId } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const body = await req.json();
    const { status, paymentStatus } = body;

    if (status && !["CONFIRMED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.ticketBooking.update({
      where: { id: bookingId },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(paymentStatus !== undefined ? { paymentStatus } : {}),
      },
      include: { ticketType: { select: { id: true, name: true, price: true } }, attendees: true },
    });

    return NextResponse.json({ success: true, data: { ...updated, totalAmount: Number(updated.totalAmount) } });
  } catch (err) {
    console.error("[PATCH /ticket-bookings/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}