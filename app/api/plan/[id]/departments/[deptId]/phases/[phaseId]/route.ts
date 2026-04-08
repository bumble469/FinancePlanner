import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

async function resolvePhase(workItemId: string, deptId: string, phaseId: string) {
  return prisma.phase.findFirst({
    where: { id: phaseId, workItemId, departmentId: deptId },
  });
}

export async function PATCH(
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

    const existing = await resolvePhase(workItemId, deptId, phaseId);
    if (!existing) return NextResponse.json({ error: "Phase not found" }, { status: 404 });

    const body = await req.json();
    const { name, startDate, endDate } = body;

    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    const phase = await prisma.phase.update({
      where: { id: phaseId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(phase);
  } catch (err) {
    console.error("[PATCH /phases/:phaseId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const existing = await resolvePhase(workItemId, deptId, phaseId);
    if (!existing) return NextResponse.json({ error: "Phase not found" }, { status: 404 });

    // Cascade is handled by Prisma schema (tasks onDelete: SetNull, so tasks survive but lose phaseId)
    await prisma.phase.delete({ where: { id: phaseId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /phases/:phaseId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}