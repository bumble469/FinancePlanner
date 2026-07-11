import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId } = params;

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