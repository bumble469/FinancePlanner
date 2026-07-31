import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string; bookingId: string; attendeeId: string }> };

async function resolveAccess(planId: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { userId } });
  const isOwner = account
    ? !!(await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } }))
    : false;
  if (isOwner) return { isOwner: true, role: "OWNER" as const, memberId: null as string | null };

  const member = await prisma.workItemMember.findFirst({ where: { workItemId: planId, userId } });
  if (!member) return null;
  return { isOwner: false, role: member.role, memberId: member.id as string | null };
}

// check-in desk — same roles as booking creation
function canCheckIn(access: { isOwner: boolean; role: string }): boolean {
  return (
    access.isOwner ||
    access.role === "ADMIN" ||
    access.role === "CO_ADMIN" ||
    access.role === "MANAGER" ||
    access.role === "CO_MANAGER"
  );
}

// PATCH — toggle check-in for a single attendee
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, bookingId, attendeeId } = await params;
    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!canCheckIn(access)) {
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