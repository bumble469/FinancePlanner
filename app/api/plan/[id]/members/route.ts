import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET: list all members of a plan
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId } = await params;

    const members = await prisma.workItemMember.findMany({
      where: {
        workItemId: planId,
      },
      include: {
        user: true,
        departmentMembers: {
          include: {
            department: true,
          },
        },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST: add member to plan + optional departments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId } = await params;
    const body = await req.json();

    const { userId, role, departmentIds = [] } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 1. Create WorkItemMember
    const workItemMember = await prisma.workItemMember.create({
      data: {
        workItemId: planId,
        userId,
        role: role || "MEMBER",
      },
    });

    // 2. Create DepartmentMember entries (if any)
    if (departmentIds.length > 0) {
      await prisma.departmentMember.createMany({
        data: departmentIds.map((deptId: string) => ({
          departmentId: deptId,
          userId,
          workItemMemberId: workItemMember.id,
        })),
        skipDuplicates: true,
      });
    }

    // 3. Return full member data
    const fullMember = await prisma.workItemMember.findUnique({
      where: {
        id: workItemMember.id,
      },
      include: {
        user: true,
        departmentMembers: {
          include: {
            department: true,
          },
        },
      },
    });

    return NextResponse.json(fullMember, { status: 201 });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User already added to this plan" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}