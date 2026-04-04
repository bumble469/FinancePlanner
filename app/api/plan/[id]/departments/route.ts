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
 
    const { id: workItemId } = await params;
 
    const departments = await prisma.department.findMany({
      where: { workItemId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        _count: {
          select: { expenses: true, tasks: true },
        },
      },
      orderBy: { name: "asc" },
    });
 
    return NextResponse.json(departments);
  } catch (error) {
    console.error("[GET /departments]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
        { error: "Only admins and managers can create departments" },
        { status: 403 }
      );
    }
 
    const body = await req.json();
    const { name, budget } = body;
 
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }
 
    // Check for duplicate name within this work item (schema has @@unique on [workItemId, name])
    const existing = await prisma.department.findUnique({
      where: {
        workItemId_name: {
          workItemId,
          name: name.trim(),
        },
      },
    });
 
    if (existing) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 409 }
      );
    }
 
    const department = await prisma.department.create({
      data: {
        workItemId,
        name: name.trim(),
        budget: budget !== undefined ? budget : null,
      },
    });
 
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("[POST /departments]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}