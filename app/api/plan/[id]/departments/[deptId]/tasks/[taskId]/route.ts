import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notify, getAllPlanUserIds } from "@/lib/notify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string; taskId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId, deptId, taskId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify task exists and belongs to this work item + department
    const existing = await prisma.task.findFirst({
      where: { id: taskId, workItemId, departmentId: deptId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      status,
      priority,
      startDate,
      dueDate,
      phaseId,
      extension,
    } = body;

    if (extension) {
      if (!extension.newDueDate) {
        return NextResponse.json({ error: "A new due date is required to extend this task" }, { status: 400 });
      }
      if (!extension.reason?.trim()) {
        return NextResponse.json({ error: "A reason is required to extend this task" }, { status: 400 });
      }
      if (isNaN(new Date(extension.newDueDate).getTime())) {
        return NextResponse.json({ error: "Invalid new due date" }, { status: 400 });
      }
    }

    // Validate status if provided
    const VALID_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate title if provided
    if (title !== undefined && (!title || !title.trim())) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    // If phaseId is being updated, verify it belongs to this work item
    if (phaseId !== undefined && phaseId !== null) {
      const phase = await prisma.phase.findFirst({
        where: { id: phaseId, workItemId },
      });
      if (!phase) {
        return NextResponse.json({ error: "Phase not found" }, { status: 404 });
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority: Number(priority) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(phaseId !== undefined && { phaseId }),
        ...(dueDate !== undefined && !extension && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(extension && {
          originalDueDate: existing.originalDueDate ?? existing.dueDate,
          dueDate: new Date(extension.newDueDate),
          extensionReason: extension.reason.trim(),
        }),
        ...(status === "DONE" && { completedAt: new Date() }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        phaseId: true,
        departmentId: true,
        startDate: true,
        dueDate: true,
        originalDueDate: true,
        extensionReason: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            workItemMember: {
              select: { id: true, user: { select: { id: true, name: true, image: true } } },
            },
          },
        },
        milestones: {
          select: {
            milestone: { select: { id: true, title: true, status: true } },
          },
        },
        dependsOn: {
          select: { dependsOnId: true },
        },
      },
    });

    if (status === "DONE" && existing.status !== "DONE") {
      const recipients = await getAllPlanUserIds(workItemId, user.sub);
      await notify({
        workItemId,
        userIds: recipients,
        scope: "GENERAL",
        type: "TASK_COMPLETED",
        title: "Task completed",
        message: `${user.name ?? "A member"} completed "${task.title}"`,
        entityType: "task",
        entityId: task.id,
      });
    }

    return NextResponse.json({
      ...task,
      milestones: task.milestones.map((mt) => mt.milestone),
    });
  } catch (err) {
    console.error("[PATCH /tasks/:taskId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string; taskId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId, deptId, taskId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify task exists and belongs to this work item + department
    const existing = await prisma.task.findFirst({
      where: { id: taskId, workItemId, departmentId: deptId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /tasks/:taskId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}