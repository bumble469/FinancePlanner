import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId, deptId } = await params;

    // Verify the user is a member of this work item
    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the department belongs to this work item
    const department = await prisma.department.findFirst({
      where: { id: deptId, workItemId },
    });
    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const tasks = await prisma.task.findMany({
      where: { workItemId, departmentId: deptId },
      orderBy: { createdAt: "asc" },
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

    return NextResponse.json(tasks);
  } catch (err) {
    console.error("[GET /tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId, deptId } = await params;

    // Verify the user is a member of this work item
    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const department = await prisma.department.findFirst({
      where: { id: deptId, workItemId },
    });
    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, phaseId, assignedToId } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (phaseId) {
      const phase = await prisma.phase.findFirst({
        where: { id: phaseId, workItemId },
      });
      if (!phase) {
        return NextResponse.json({ error: "Phase not found" }, { status: 404 });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ?? null,
        workItemId,
        departmentId: deptId,
        phaseId: phaseId ?? null,
        assignedToId: assignedToId ?? null,
        status: "TODO",
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

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("[POST /tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}