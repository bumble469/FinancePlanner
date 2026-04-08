import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workItemId, deptId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const department = await prisma.department.findFirst({
      where: { id: deptId, workItemId },
    });
    if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });

    const phases = await prisma.phase.findMany({
      where: { workItemId, departmentId: deptId },
      orderBy: { createdAt: "asc" },
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

    return NextResponse.json(phases);
  } catch (err) {
    console.error("[GET /phases]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workItemId, deptId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const department = await prisma.department.findFirst({
      where: { id: deptId, workItemId },
    });
    if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });

    const body = await req.json();
    const { name, startDate, endDate } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const phase = await prisma.phase.create({
      data: {
        name: name.trim(),
        workItemId,
        departmentId: deptId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
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

    return NextResponse.json(phase, { status: 201 });
  } catch (err) {
    console.error("[POST /phases]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}