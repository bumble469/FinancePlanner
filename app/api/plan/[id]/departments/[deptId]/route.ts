import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId, deptId } = await params;

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
        { error: "Only admins and managers can edit departments" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, budget } = body; // ✅ no deptId from body

    const department = await prisma.department.findFirst({
      where: { id: deptId, workItemId },
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    if (name && name.trim() !== department.name) {
      const duplicate = await prisma.department.findUnique({
        where: { workItemId_name: { workItemId, name: name.trim() } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A department with this name already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.department.update({
      where: { id: deptId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(budget !== undefined && { budget }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /departments]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workItemId, deptId } = await params;

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

    if (membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete departments" },
        { status: 403 }
      );
    }

    const department = await prisma.department.findFirst({
      where: { id: deptId, workItemId },
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    await prisma.department.delete({ where: { id: deptId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /departments]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}