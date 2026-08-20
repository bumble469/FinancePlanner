import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";

type Params = { params: Promise<{ id: string; bookingId: string; attendeeId: string }> };

// PATCH — toggle check-in for a single attendee
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, bookingId, attendeeId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
    if (!access.permissions.canCheckInAttendee) {
      return NextResponse.json({ error: "You don't have permission to check attendees in" }, { status: 403 });
    }

    const attendee = await prisma.ticketAttendee.findFirst({
      where: { id: attendeeId, bookingId },
      include: { booking: { select: { workItemId: true, status: true } } },
    });
    if (!attendee || attendee.booking.workItemId !== planId) {
      return NextResponse.json({ error: "Attendee not found" }, { status: 404 });
    }
    if (attendee.booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot check in an attendee on a cancelled booking" }, { status: 400 });
    }

    const body = await req.json();
    const checkedIn = body.checkedIn !== false; // default true

    const updated = await prisma.ticketAttendee.update({
      where: { id: attendeeId },
      data: {
        checkedIn,
        checkedInAt: checkedIn ? new Date() : null,
        checkedInById: checkedIn ? access.memberId : null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /ticket-bookings/:id/attendees/:attendeeId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}