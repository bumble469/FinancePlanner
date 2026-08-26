import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notify, getDepartmentMemberUserIds } from "@/lib/notify";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!membership) {
      const account = await prisma.account.findUnique({ where: { userId: user.sub } });
      const isOwner = account
        ? !!(await prisma.workItem.findFirst({ where: { id: workItemId, accountId: account.id } }))
        : false;
      if (!isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const milestones = await prisma.milestone.findMany({
      where: { workItemId },
      include: {
        tasks: {
          include: {
            task: true,
          },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = milestones.map((m) => ({
      ...m,
      tasks: m.tasks.map((mt) => ({
        id: mt.task.id,
        title: mt.task.title,
        status: mt.task.status,
        priority: mt.task.priority,
        startDate: mt.task.startDate,
        dueDate: mt.task.dueDate,
        originalDueDate: mt.task.originalDueDate,
        extensionReason: mt.task.extensionReason,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[GET /milestones]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId } = await params;

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
        { error: "Only admins and managers can create milestones" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      title,
      description,
      dueDate,
      status,
      taskIds = [],
    } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (taskIds.length > 0) {
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

      if (dueDate) {
        const tasksWithDueDates = await prisma.task.findMany({
          where: { id: { in: taskIds }, dueDate: { not: null } },
          select: { title: true, dueDate: true },
        });
        const milestoneDate = new Date(dueDate);
        const offender = tasksWithDueDates.find((t) => t.dueDate! > milestoneDate);
        if (offender) {
          return NextResponse.json(
            {
              error: `Task "${offender.title}" is due ${offender.dueDate!.toISOString().split("T")[0]}, which is after this milestone's due date. Choose a later milestone date or remove that task.`,
            },
            { status: 400 }
          );
        }
      }

      const alreadyLinked = await prisma.milestoneTask.findMany({
        where: { taskId: { in: taskIds } },
        include: {
          task: { select: { title: true } },
          milestone: { select: { title: true } },
        },
      });

      if (alreadyLinked.length > 0) {
        const names = alreadyLinked
          .map((l) => `"${l.task.title}" (in "${l.milestone.title}")`)
          .join(", ");
        return NextResponse.json(
          { error: `These tasks already belong to another milestone: ${names}` },
          { status: 400 }
        );
      }
    }

    const milestone = await prisma.milestone.create({
      data: {
        workItemId,
        title: title.trim(),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "UPCOMING",
        createdBy: user.sub,

        tasks: {
          create: taskIds.map((taskId: string) => ({
            taskId,
          })),
        },
      },
      include: {
        tasks: {
          include: {
            task: true,
          },
        },
      },
    });

    if (taskIds.length > 0) {
      const linkedTasks = await prisma.task.findMany({
        where: { id: { in: taskIds } },
        select: {
          departmentId: true,
          members: { select: { workItemMember: { select: { userId: true } } } },
        },
      });

      const deptIds = Array.from(new Set(linkedTasks.map((t) => t.departmentId).filter(Boolean))) as string[];
      const assigneeUserIds = Array.from(
        new Set(linkedTasks.flatMap((t) => t.members.map((m) => m.workItemMember.userId)))
      );

      if (deptIds.length > 0) {
        const deptUserIds = await getDepartmentMemberUserIds(deptIds, user.sub);
        await notify({
          workItemId,
          userIds: deptUserIds.filter((id) => !assigneeUserIds.includes(id)),
          scope: "GENERAL",
          type: "MILESTONE_CREATED",
          title: "New milestone created",
          message: `"${milestone.title}" was created for your department.`,
          entityType: "milestone",
          entityId: milestone.id,
        });
      }

      if (assigneeUserIds.length > 0) {
        await notify({
          workItemId,
          userIds: assigneeUserIds,
          scope: "PERSONAL",
          type: "MILESTONE_TASK_INCLUDED",
          title: "Your tasks are part of a new milestone",
          message: `Your task(s) are now part of the milestone "${milestone.title}".`,
          entityType: "milestone",
          entityId: milestone.id,
        });
      }
    }

    const formatted = {
      ...milestone,
      tasks: milestone.tasks.map((mt) => ({
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

    return NextResponse.json(formatted, { status: 201 });
  } catch (err) {
    console.error("[POST /milestones]", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err },
      { status: 500 }
    );
  }
}