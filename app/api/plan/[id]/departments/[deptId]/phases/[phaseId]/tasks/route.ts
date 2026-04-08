import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

async function resolvePhase(workItemId: string, deptId: string, phaseId: string) {
  return prisma.phase.findFirst({
    where: { id: phaseId, workItemId, departmentId: deptId },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string; phaseId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workItemId, deptId, phaseId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const phase = await resolvePhase(workItemId, deptId, phaseId);
    if (!phase) return NextResponse.json({ error: "Phase not found" }, { status: 404 });

    const tasks = await prisma.task.findMany({
      where: { workItemId, departmentId: deptId, phaseId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        phaseId: true,
        departmentId: true,
        assignedToId: true,
        assignedTo: { select: { id: true, name: true, image: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(tasks);
  } catch (err) {
    console.error("[GET /phases/:phaseId/tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string; phaseId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workItemId, deptId, phaseId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const phase = await resolvePhase(workItemId, deptId, phaseId);
    if (!phase) return NextResponse.json({ error: "Phase not found" }, { status: 404 });

    const body = await req.json();
    const { title, description, assignedToId } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ?? null,
        status: "TODO",
        workItemId,
        departmentId: deptId,
        phaseId,
        assignedToId: assignedToId ?? null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        phaseId: true,
        departmentId: true,
        assignedToId: true,
        assignedTo: { select: { id: true, name: true, image: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("[POST /phases/:phaseId/tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}