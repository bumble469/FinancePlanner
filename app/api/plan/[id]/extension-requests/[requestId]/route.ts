import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id: workItemId, requestId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, reviewNote, applyMode } = body as {
      action?: "APPROVE" | "REJECT";
      reviewNote?: string;
      applyMode?: "AUTO" | "MANUAL";
    };

    const member = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!member) return NextResponse.json({ error: "Not a member of this plan" }, { status: 403 });

    const existing = await prisma.extensionRequest.findUnique({
      where: { id: requestId },
      include: { task: true, milestone: true },
    });
    if (!existing || existing.workItemId !== workItemId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // ── apply mode call (after already approved) ──
    if (applyMode && !action) {
      if (existing.status !== "APPROVED") {
        return NextResponse.json({ error: "Only approved requests can be applied" }, { status: 400 });
      }
      if (existing.applyMode) {
        return NextResponse.json({ error: "Already applied" }, { status: 400 });
      }

      if (applyMode === "AUTO") {
        if (existing.targetType === "TASK" && existing.taskId) {
          await prisma.task.update({
            where: { id: existing.taskId },
            data: {
              originalDueDate: existing.task?.originalDueDate ?? existing.task?.dueDate,
              dueDate: existing.requestedDueDate,
              extensionReason: existing.reason,
            },
          });
        } else if (existing.targetType === "MILESTONE" && existing.milestoneId) {
          await prisma.milestone.update({
            where: { id: existing.milestoneId },
            data: {
              originalDueDate: existing.milestone?.originalDueDate ?? existing.milestone?.dueDate,
              dueDate: existing.requestedDueDate,
              extensionReason: existing.reason,
            },
          });
          await prisma.milestoneExtensionLog.create({
            data: {
              milestoneId: existing.milestoneId,
              previousDueDate: existing.milestone?.dueDate,
              newDueDate: existing.requestedDueDate,
              reason: existing.reason,
              extendedById: member.id,
            },
          });
        }
      }

      const updated = await prisma.extensionRequest.update({
        where: { id: requestId },
        data: { applyMode },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // ── approve / reject ──
    // ── approve / reject ──
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Request already reviewed" }, { status: 400 });
    }
    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Approval gate: ADMIN always; CO_ADMIN if granted; MANAGER if granted, own dept only
    const perms = member.permissions as any;
    let canApprove = member.role === "ADMIN" || (member.role === "CO_ADMIN" && perms?.extensions?.approve === true);

    if (!canApprove && member.role === "MANAGER" && existing.departmentId) {
      const inDept = await prisma.departmentMember.findFirst({
        where: { workItemMemberId: member.id, departmentId: existing.departmentId },
      });
      canApprove = !!inDept && perms?.canApproveExtensionRequests === true;
    }

    if (!canApprove) {
      return NextResponse.json({ error: "You don't have permission to review this request" }, { status: 403 });
    }

    // If approving with an applyMode chosen up front (checkbox), apply it right away
    if (action === "APPROVE" && applyMode === "AUTO") {
      if (existing.targetType === "TASK" && existing.taskId) {
        await prisma.task.update({
          where: { id: existing.taskId },
          data: {
            originalDueDate: existing.task?.originalDueDate ?? existing.task?.dueDate,
            dueDate: existing.requestedDueDate,
            extensionReason: existing.reason,
          },
        });
      } else if (existing.targetType === "MILESTONE" && existing.milestoneId) {
        await prisma.milestone.update({
          where: { id: existing.milestoneId },
          data: {
            originalDueDate: existing.milestone?.originalDueDate ?? existing.milestone?.dueDate,
            dueDate: existing.requestedDueDate,
            extensionReason: existing.reason,
          },
        });
        await prisma.milestoneExtensionLog.create({
          data: {
            milestoneId: existing.milestoneId,
            previousDueDate: existing.milestone?.dueDate,
            newDueDate: existing.requestedDueDate,
            reason: existing.reason,
            extendedById: member.id,
          },
        });
      }
    }

    const updated = await prisma.extensionRequest.update({
      where: { id: requestId },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewedById: member.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote?.trim() || null,
        ...(action === "APPROVE" && applyMode ? { applyMode } : {}),
      },
    });

    const requester = await prisma.workItemMember.findUnique({
      where: { id: existing.requestedById },
      select: { userId: true },
    });

    await notify({
      workItemId,
      userIds: requester ? [requester.userId] : [],
      scope: "PERSONAL",
      type: action === "APPROVE" ? "EXTENSION_APPROVED" : "EXTENSION_REJECTED",
      title: action === "APPROVE" ? "Extension approved" : "Extension rejected",
      message:
        action === "APPROVE"
          ? "Your extension request was approved."
          : `Your extension request was rejected.${reviewNote ? ` Reason: ${reviewNote}` : ""}`,
      entityType: existing.targetType.toLowerCase(),
      entityId: existing.taskId ?? existing.milestoneId ?? "",
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH .../extension-requests/[requestId]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}