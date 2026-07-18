import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notify, getAllPlanUserIds } from "@/lib/notify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; deptId: string; taskId: string; submissionId: string }> }
) {
  try {
    const { id: workItemId, deptId, taskId, submissionId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!member) return NextResponse.json({ error: "Not a member of this plan" }, { status: 403 });

    let canApprove = member.role === "ADMIN" || member.role === "CO_ADMIN";
    if (!canApprove && member.role === "MANAGER") {
      const inDept = await prisma.departmentMember.findFirst({
        where: { workItemMemberId: member.id, departmentId: deptId },
      });
      canApprove = !!inDept;
    }
    if (!canApprove && member.role === "CO_MANAGER") {
      const perms = member.permissions as any;
      const inDept = await prisma.departmentMember.findFirst({
        where: { workItemMemberId: member.id, departmentId: deptId },
      });
      canApprove = !!inDept && perms?.canApproveTaskSubmissions === true;
    }
    if (!canApprove) {
      return NextResponse.json({ error: "You don't have permission to review submissions" }, { status: 403 });
    }

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: { task: true },
    });
    if (!submission || submission.taskId !== taskId) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (submission.status !== "PENDING") {
      return NextResponse.json({ error: "Submission already reviewed" }, { status: 400 });
    }

    const body = await req.json();
    const { action, reviewComment } = body as { action: "APPROVE" | "REJECT"; reviewComment?: string };

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (action === "REJECT" && !reviewComment?.trim()) {
      return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
    }

    await prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewedById: member.id,
        reviewedAt: new Date(),
        reviewComment: reviewComment?.trim() || null,
      },
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { status: action === "APPROVE" ? "COMPLETED" : "CHANGES_REQUESTED" },
    });

    const submitter = await prisma.workItemMember.findUnique({
      where: { id: submission.submittedById },
      select: { userId: true },
    });

    if (action === "APPROVE") {
      const recipients = await getAllPlanUserIds(workItemId, user.sub);
      await notify({
        workItemId,
        userIds: recipients,
        scope: "GENERAL",
        type: "TASK_COMPLETED",
        title: "Task completed",
        message: `"${submission.task.title}" was approved and marked complete`,
        entityType: "task",
        entityId: taskId,
      });
    } else if (submitter) {
      await notify({
        workItemId,
        userIds: [submitter.userId],
        scope: "PERSONAL",
        type: "TASK_SUBMISSION_REJECTED",
        title: "Changes requested",
        message: `Your submission for "${submission.task.title}" needs changes: ${reviewComment}`,
        entityType: "task",
        entityId: taskId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH .../submissions/[submissionId]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}