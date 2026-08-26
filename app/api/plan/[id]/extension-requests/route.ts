import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notify, getAllPlanUserIds } from "@/lib/notify";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workItemId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { targetType, taskId, milestoneId, requestedDueDate, reason } = body as {
      targetType: "TASK" | "MILESTONE";
      taskId?: string;
      milestoneId?: string;
      requestedDueDate: string;
      reason: string;
    };

    if (!requestedDueDate || !reason?.trim()) {
      return NextResponse.json({ error: "requestedDueDate and reason are required" }, { status: 400 });
    }

    const member = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!member) return NextResponse.json({ error: "Not a member of this plan" }, { status: 403 });

    let departmentId: string | null = null;
    let currentDueDate: Date | null = null;
    let isAssignedToMe = false;

    if (targetType === "TASK") {
      const linkedMilestone = await prisma.milestoneTask.findFirst({
        where: { taskId },
        include: { milestone: { select: { dueDate: true, title: true } } },
      });
      if (linkedMilestone?.milestone.dueDate && new Date(requestedDueDate) > linkedMilestone.milestone.dueDate) {
        return NextResponse.json(
          {
            error: `Requested date is beyond milestone "${linkedMilestone.milestone.title}"'s due date. Request a milestone extension first.`,
          },
          { status: 400 }
        );
      }
    } else {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { tasks: { include: { task: { select: { departmentId: true } } } } },
      });
      if (!milestone || milestone.workItemId !== workItemId) {
        return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
      }
      currentDueDate = milestone.dueDate;
      // resolve department via linked tasks — manager/co-manager scoping needs *a* dept match
      departmentId = milestone.tasks.find((mt) => mt.task.departmentId)?.task.departmentId ?? null;
    }

    // Permission check — mirrors lib/permissions.ts logic server-side
    const role = member.role;
    const perms = member.permissions as any;
    const departmentIds = departmentId
      ? (await prisma.departmentMember.findMany({
          where: { workItemMemberId: member.id },
          select: { departmentId: true },
        })).map((d) => d.departmentId)
      : [];
    const inScope = departmentId ? departmentIds.includes(departmentId) : false;

    const allowed =
      targetType === "TASK"
        ? (role === "MEMBER" && isAssignedToMe) ||
          (role === "MANAGER" && inScope) ||
          (role === "CO_MANAGER" && inScope && perms?.canRequestExtension === true)
        : (role === "MANAGER" && inScope) ||
          (role === "CO_MANAGER" && inScope && perms?.canRequestExtension === true);

    if (!allowed) {
      return NextResponse.json({ error: "You don't have permission to request this extension" }, { status: 403 });
    }

    const request = await prisma.extensionRequest.create({
      data: {
        workItemId,
        targetType,
        taskId: targetType === "TASK" ? taskId : null,
        milestoneId: targetType === "MILESTONE" ? milestoneId : null,
        departmentId,
        currentDueDate,
        requestedDueDate: new Date(requestedDueDate),
        reason: reason.trim(),
        requestedById: member.id,
      },
    });

    // Notify: department members (excluding requester) + all ADMIN/CO_ADMIN on the plan
    const deptMemberUserIds = departmentId
      ? (await prisma.departmentMember.findMany({
          where: { departmentId },
          select: { userId: true },
        })).map((d) => d.userId)
      : [];
    const adminUserIds = (
      await prisma.workItemMember.findMany({
        where: { workItemId, role: { in: ["ADMIN", "CO_ADMIN"] } },
        select: { userId: true },
      })
    ).map((m) => m.userId);

    const recipients = Array.from(new Set([...deptMemberUserIds, ...adminUserIds])).filter(
      (uid) => uid !== user.sub
    );

    await notify({
      workItemId,
      userIds: recipients,
      scope: "GENERAL",
      type: "EXTENSION_REQUESTED",
      title: "Extension requested",
      message: `${user.name ?? "A member"} requested an extension: "${reason.trim()}"`,
      entityType: targetType.toLowerCase(),
      entityId: targetType === "TASK" ? taskId! : milestoneId!,
    });

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error("[POST /api/plan/[id]/extension-requests] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}