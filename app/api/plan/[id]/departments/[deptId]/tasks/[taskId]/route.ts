import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
    const { title, description, status, phaseId, assignedToId } = body;

    // Validate status if provided
    const VALID_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
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
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(phaseId !== undefined && { phaseId }),         // null clears it
        ...(assignedToId !== undefined && { assignedToId }), // null unassigns
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        phaseId: true,
        departmentId: true,
        assignedToId: true,
        assignedTo: {
          select: { id: true, name: true, image: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(task);
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