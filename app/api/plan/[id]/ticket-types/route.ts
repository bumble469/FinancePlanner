import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";

type Params = { params: Promise<{ id: string }> };

function formatTicketType(t: any) {
  return { ...t, price: Number(t.price) };
}

// GET /api/plan/[id]/ticket-types
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const ticketTypes = await prisma.ticketType.findMany({
      where: { workItemId: planId },
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: ticketTypes.map(formatTicketType) });
  } catch (err) {
    console.error("[GET /ticket-types]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/plan/[id]/ticket-types
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!access.permissions.canManageTicketing) {
      return NextResponse.json({ error: "You don't have permission to manage ticket types" }, { status: 403 });
    }

    const body = await req.json();
    const { name, price, capacity, salesStart, salesEnd, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Ticket type name is required" }, { status: 400 });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    if (capacity !== undefined && capacity !== null && (isNaN(Number(capacity)) || Number(capacity) < 0)) {
      return NextResponse.json({ error: "Invalid capacity" }, { status: 400 });
    }

    const ticketType = await prisma.ticketType.create({
      data: {
        workItemId: planId,
        name: name.trim(),
        price: Number(price),
        capacity: capacity !== undefined && capacity !== null ? Number(capacity) : null,
        salesStart: salesStart ? new Date(salesStart) : null,
        salesEnd: salesEnd ? new Date(salesEnd) : null,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: formatTicketType(ticketType) }, { status: 201 });
  } catch (err) {
    console.error("[POST /ticket-types]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}