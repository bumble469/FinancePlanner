import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";

type Params = { params: Promise<{ id: string }> };

function generateBookingCode() {
  return `TB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function formatBooking(b: any) {
  return { ...b, totalAmount: Number(b.totalAmount) };
}

// GET /api/plan/[id]/ticket-bookings
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const ticketTypeId = req.nextUrl.searchParams.get("ticketTypeId") || undefined;

    const bookings = await prisma.ticketBooking.findMany({
      where: { workItemId: planId, ...(ticketTypeId ? { ticketTypeId } : {}) },
      include: { ticketType: { select: { id: true, name: true, price: true } }, attendees: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: bookings.map(formatBooking) });
  } catch (err) {
    console.error("[GET /ticket-bookings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/plan/[id]/ticket-bookings
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!access.permissions.canManageTicketing && !access.permissions.canCheckInAttendee) {
      return NextResponse.json({ error: "You don't have permission to create bookings" }, { status: 403 });
    }

    const body = await req.json();
    const {
      ticketTypeId,
      bookedByName,
      bookedByEmail,
      bookedByPhone,
      quantity,
      attendees,
      forceCreate,
      paymentMethod,
    } = body;

    if (!ticketTypeId) return NextResponse.json({ error: "ticketTypeId is required" }, { status: 400 });
    if (!bookedByName?.trim()) return NextResponse.json({ error: "Booker name is required" }, { status: 400 });
    if (!bookedByEmail?.trim() && !bookedByPhone?.trim()) {
      return NextResponse.json({ error: "Either an email or a phone number is required" }, { status: 400 });
    }
    if (!paymentMethod || !["CASH", "UPI"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Payment method must be CASH or UPI" }, { status: 400 });
    }
    const qty = Number(quantity);
    if (!qty || isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    if (attendees && Array.isArray(attendees) && attendees.length !== qty) {
      return NextResponse.json({ error: "Number of attendees must match quantity" }, { status: 400 });
    }

    const ticketType = await prisma.ticketType.findFirst({ where: { id: ticketTypeId, workItemId: planId } });
    if (!ticketType) return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
    if (!ticketType.isActive) return NextResponse.json({ error: "This ticket type is not active" }, { status: 400 });

    // capacity check
    if (ticketType.capacity !== null) {
      const sold = await prisma.ticketBooking.aggregate({
        where: { ticketTypeId, status: "CONFIRMED" },
        _sum: { quantity: true },
      });
      const alreadySold = sold._sum.quantity ?? 0;
      if (alreadySold + qty > ticketType.capacity) {
        return NextResponse.json(
          { error: `Only ${ticketType.capacity - alreadySold} tickets remaining for ${ticketType.name}` },
          { status: 409 }
        );
      }
    }

    // duplicate check — warn, don't hard block, unless client hasn't confirmed
    if (!forceCreate) {
      const duplicate = await prisma.ticketBooking.findFirst({
        where: {
          ticketTypeId,
          status: "CONFIRMED",
          OR: [
            ...(bookedByEmail?.trim() ? [{ bookedByEmail: { equals: bookedByEmail.trim(), mode: "insensitive" as const } }] : []),
            ...(bookedByPhone?.trim() ? [{ bookedByPhone: bookedByPhone.trim() }] : []),
          ],
        },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            warning: true,
            message: "A booking with this email/phone already exists for this ticket type. Submit again with forceCreate to proceed anyway.",
            existingBookingId: duplicate.id,
          },
          { status: 409 }
        );
      }
    }

    const totalAmount = Number(ticketType.price) * qty;

    const attendeeData =
      attendees && Array.isArray(attendees) && attendees.length > 0
        ? attendees.map((a: any) => ({ name: (a.name || bookedByName).trim(), email: a.email?.trim() || null }))
        : Array.from({ length: qty }, (_, i) => ({
            name: qty === 1 ? bookedByName.trim() : `${bookedByName.trim()} (Guest ${i + 1})`,
            email: null,
          }));

    const booking = await prisma.ticketBooking.create({
      data: {
        workItemId: planId,
        ticketTypeId,
        bookedByName: bookedByName.trim(),
        bookedByEmail: bookedByEmail?.trim() || null,
        bookedByPhone: bookedByPhone?.trim() || null,
        quantity: qty,
        totalAmount,
        paymentStatus: "COMPLETED",
        paymentMethod,
        status: "CONFIRMED",
        bookingCode: generateBookingCode(),
        attendees: { create: attendeeData },
      },
      include: { ticketType: { select: { id: true, name: true, price: true } }, attendees: true },
    });

    return NextResponse.json({ success: true, data: formatBooking(booking) }, { status: 201 });
  } catch (err) {
    console.error("[POST /ticket-bookings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}