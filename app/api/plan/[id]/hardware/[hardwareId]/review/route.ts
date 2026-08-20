import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getPlanAccess } from "@/lib/get-plan-access";
import { notify } from "@/lib/notify";

type Params = { params: Promise<{ id: string; hardwareId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, hardwareId } = await params;
    const access = await getPlanAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const item = await prisma.hardwareItem.findFirst({ where: { id: hardwareId, workItemId: planId } });
    if (!item) return NextResponse.json({ error: "Hardware item not found" }, { status: 404 });
    if (item.requestStatus !== "PENDING") {
      return NextResponse.json({ error: "This request has already been reviewed" }, { status: 409 });
    }

    if (!access.permissions.canApproveHardwareRequest(item.departmentId)) {
      return NextResponse.json({ error: "You don't have permission to review this request" }, { status: 403 });
    }

    const body = await req.json();
    const { action, reason, initialCondition } = body;

    if (!["approve", "decline"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'decline'" }, { status: 400 });
    }
    if (action === "decline" && !reason?.trim()) {
      return NextResponse.json({ error: "A reason is required to decline a request" }, { status: 400 });
    }

    const updated = await prisma.hardwareItem.update({
      where: { id: hardwareId },
      data: {
        requestStatus: action === "approve" ? "APPROVED" : "DECLINED",
        declineReason: action === "decline" ? reason.trim() : null,
        reviewedById: access.memberId,
        reviewedAt: new Date(),
        condition: action === "approve" ? (initialCondition || "WORKING") : null,
      },
      include: {
        department: { select: { id: true, name: true } },
        stall: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, user: { select: { id: true, name: true } } } },
        reviewedBy: { select: { id: true, user: { select: { id: true, name: true } } } },
      },
    });

        await notify({
      workItemId: planId,
      userIds: [updated.requestedBy.user.id],
      scope: "PERSONAL",
      type: action === "approve" ? "HARDWARE_APPROVED" : "HARDWARE_DECLINED",
      title: action === "approve" ? "Hardware request approved" : "Hardware request declined",
      message: action === "approve"
        ? `Your request for "${updated.name}" was approved.`
        : `Your request for "${updated.name}" was declined${reason ? `: ${reason.trim()}` : "."}`,
      entityType: "hardware",
      entityId: updated.id,
    });

    return NextResponse.json({
      success: true,
      data: { ...updated, monthlyRentAmount: updated.monthlyRentAmount !== null ? Number(updated.monthlyRentAmount) : null, depositAmount: updated.depositAmount !== null ? Number(updated.depositAmount) : null },
    });

    return NextResponse.json({
      success: true,
      data: { ...updated, monthlyRentAmount: updated.monthlyRentAmount !== null ? Number(updated.monthlyRentAmount) : null, depositAmount: updated.depositAmount !== null ? Number(updated.depositAmount) : null },
    });
  } catch (err) {
    console.error("[PATCH /hardware/:id/review]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}