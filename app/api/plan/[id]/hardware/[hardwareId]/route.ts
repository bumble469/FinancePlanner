import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";

type Params = { params: Promise<{ id: string; hardwareId: string }> };

function formatHardware(h: any) {
  return {
    ...h,
    monthlyRentAmount: h.monthlyRentAmount !== null ? Number(h.monthlyRentAmount) : null,
    depositAmount: h.depositAmount !== null ? Number(h.depositAmount) : null,
  };
}

// PATCH — edit fields (name, vendor, quantity, notes, rental dates/amount)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, hardwareId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const item = await prisma.hardwareItem.findFirst({ where: { id: hardwareId, workItemId: planId } });
    if (!item) return NextResponse.json({ error: "Hardware item not found" }, { status: 404 });

    if (!access.permissions.canManageHardware(item.departmentId)) {
      return NextResponse.json({ error: "You don't have permission to manage this hardware item" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name, vendor, quantity, notes, departmentId, stallId,
      rentalStart, rentalEnd, monthlyRentAmount, depositAmount, depositReturned,
    } = body;

    if (departmentId !== undefined && departmentId !== null) {
      const dept = await prisma.department.findFirst({ where: { id: departmentId, workItemId: planId } });
      if (!dept) return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }
    if (stallId !== undefined && stallId !== null) {
      const stall = await prisma.stall.findFirst({ where: { id: stallId, workItemId: planId } });
      if (!stall) return NextResponse.json({ error: "Invalid stall" }, { status: 400 });
    }

    const updated = await prisma.hardwareItem.update({
      where: { id: hardwareId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(vendor !== undefined ? { vendor: vendor?.trim() || null } : {}),
        ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
        ...(stallId !== undefined ? { stallId: stallId || null } : {}),
        ...(rentalStart !== undefined ? { rentalStart: rentalStart ? new Date(rentalStart) : null } : {}),
        ...(rentalEnd !== undefined ? { rentalEnd: rentalEnd ? new Date(rentalEnd) : null } : {}),
        ...(monthlyRentAmount !== undefined ? { monthlyRentAmount: monthlyRentAmount !== null ? Number(monthlyRentAmount) : null } : {}),
        ...(depositAmount !== undefined ? { depositAmount: depositAmount !== null ? Number(depositAmount) : null } : {}),
        ...(depositReturned !== undefined ? { depositReturned: !!depositReturned } : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        stall: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, user: { select: { id: true, name: true } } } },
        reviewedBy: { select: { id: true, user: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({ success: true, data: formatHardware(updated) });
  } catch (err) {
    console.error("[PATCH /hardware/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, hardwareId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!access.permissions.canDeleteHardware) {
      return NextResponse.json({ error: "You don't have permission to delete hardware items" }, { status: 403 });
    }

    const item = await prisma.hardwareItem.findFirst({ where: { id: hardwareId, workItemId: planId } });
    if (!item) return NextResponse.json({ error: "Hardware item not found" }, { status: 404 });

    // Expense rows tagged to this item keep their history — onDelete: SetNull, same pattern as Stall deletion
    await prisma.hardwareItem.delete({ where: { id: hardwareId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /hardware/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}