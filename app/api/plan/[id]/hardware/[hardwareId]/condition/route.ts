import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";

type Params = { params: Promise<{ id: string; hardwareId: string }> };

const VALID_CONDITIONS = ["WORKING", "IN_USE", "BROKEN_DOWN", "PURCHASED", "RETURNED", "LOST"];

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, hardwareId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const item = await prisma.hardwareItem.findFirst({ where: { id: hardwareId, workItemId: planId } });
    if (!item) return NextResponse.json({ error: "Hardware item not found" }, { status: 404 });
    if (item.requestStatus !== "APPROVED") {
      return NextResponse.json({ error: "Only approved hardware has a condition to update" }, { status: 400 });
    }

    if (!access.permissions.canManageHardware(item.departmentId)) {
      return NextResponse.json({ error: "You don't have permission to update this item's condition" }, { status: 403 });
    }

    const body = await req.json();
    const { condition } = body;
    if (!VALID_CONDITIONS.includes(condition)) {
      return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
    }

    // Converting a rented item to a permanent purchase stops future monthly billing —
    // the purchase itself should be recorded as a one-off Expense by the person doing it.
    const stoppingRentBilling = condition === "PURCHASED" || condition === "RETURNED" || condition === "LOST";

    const updated = await prisma.hardwareItem.update({
      where: { id: hardwareId },
      data: {
        condition,
        ...(stoppingRentBilling ? { monthlyRentAmount: null } : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        stall: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, user: { select: { id: true, name: true } } } },
        reviewedBy: { select: { id: true, user: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...updated, monthlyRentAmount: updated.monthlyRentAmount !== null ? Number(updated.monthlyRentAmount) : null, depositAmount: updated.depositAmount !== null ? Number(updated.depositAmount) : null },
    });
  } catch (err) {
    console.error("[PATCH /hardware/:id/condition]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}