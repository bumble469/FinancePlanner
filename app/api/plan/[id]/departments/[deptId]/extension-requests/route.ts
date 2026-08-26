import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; deptId: string }> }
) {
  try {
    const { id: workItemId, deptId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!member) return NextResponse.json({ error: "Not a member of this plan" }, { status: 403 });

    // View gate: ADMIN/CO_ADMIN always; MANAGER only for their own department
    if (member.role === "MANAGER") {
      const inDept = await prisma.departmentMember.findFirst({
        where: { workItemMemberId: member.id, departmentId: deptId },
      });
      if (!inDept) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (member.role !== "ADMIN" && member.role !== "CO_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requests = await prisma.extensionRequest.findMany({
      where: { workItemId, departmentId: deptId },
      include: {
        task: { select: { id: true, title: true } },
        milestone: { select: { id: true, title: true } },
        requestedBy: { include: { user: { select: { name: true } } } },
        reviewedBy: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("[GET .../extension-requests] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}