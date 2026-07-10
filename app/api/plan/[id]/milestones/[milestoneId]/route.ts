import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId, milestoneId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: {
        workItemId_userId: {
          workItemId,
          userId: user.sub,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (membership.role === "MEMBER") {
      return NextResponse.json(
        { error: "Only admins and managers can delete milestones" },
        { status: 403 }
      );
    }

    // ensure milestone belongs to this workItem
    const existing = await prisma.milestone.findFirst({
      where: { id: milestoneId, workItemId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    await prisma.milestone.delete({
      where: { id: milestoneId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /milestone]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId, milestoneId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: {
        workItemId_userId: {
          workItemId,
          userId: user.sub,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (membership.role === "MEMBER") {
      return NextResponse.json(
        { error: "Only admins and managers can update milestones" },
        { status: 403 }
      );
    }

    const existing = await prisma.milestone.findFirst({
      where: { id: milestoneId, workItemId },
      include: { tasks: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const body = await req.json();

    const {
      title,
      description,
      dueDate,
      status,
      taskIds,
      extension, // optional: { newDueDate: string; reason: string }
    } = body;

    // ✅ validate title if provided
    if (title !== undefined && (!title || title.trim() === "")) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }

    // ✅ validate tasks
    if (taskIds) {
      const validTasks = await prisma.task.count({
        where: {
          id: { in: taskIds },
          workItemId,
        },
      });

      if (validTasks !== taskIds.length) {
        return NextResponse.json(
          { error: "Invalid taskIds provided" },
          { status: 400 }
        );
      }
    }

    // ✅ validate extension payload, if this is a deadline-extension request
    if (extension) {
      if (!extension.newDueDate) {
        return NextResponse.json(
          { error: "A new due date is required to extend this milestone" },
          { status: 400 }
        );
      }
      if (!extension.reason || !extension.reason.trim()) {
        return NextResponse.json(
          { error: "A reason is required to extend this milestone" },
          { status: 400 }
        );
      }
      const newDue = new Date(extension.newDueDate);
      if (isNaN(newDue.getTime())) {
        return NextResponse.json(
          { error: "Invalid new due date" },
          { status: 400 }
        );
      }
    }

    let taskOps = undefined;

    if (Array.isArray(taskIds)) {
      const existingTaskIds = existing.tasks.map((t) => t.taskId);

      const toAdd = taskIds.filter((id) => !existingTaskIds.includes(id));
      const toRemove = existingTaskIds.filter((id) => !taskIds.includes(id));

      taskOps = {
        ...(toRemove.length > 0 && {
          deleteMany: {
            taskId: { in: toRemove },
          },
        }),
        ...(toAdd.length > 0 && {
          create: toAdd.map((taskId) => ({ taskId })),
        }),
      };
    }

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        // plain due-date edits (no extension payload) behave exactly as before
        ...(dueDate !== undefined && !extension && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(status !== undefined && { status }),

        // deadline extension — preserves the original due date on first use only
        ...(extension && {
          originalDueDate: existing.originalDueDate ?? existing.dueDate,
          dueDate: new Date(extension.newDueDate),
          extensionReason: extension.reason.trim(),
        }),

        ...(taskIds && {
          tasks: taskOps,
        }),
      },
      include: {
        tasks: {
          include: { task: true },
        },
      },
    });

    const formatted = {
      ...updated,
      tasks: updated.tasks.map((mt) => ({
        id: mt.task.id,
        title: mt.task.title,
        status: mt.task.status,
        priority: mt.task.priority,
        startDate: mt.task.startDate,
        dueDate: mt.task.dueDate,
        originalDueDate: mt.task.originalDueDate,
        extensionReason: mt.task.extensionReason,
      })),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[PATCH /milestone]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}