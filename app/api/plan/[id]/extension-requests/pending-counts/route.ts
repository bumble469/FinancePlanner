import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workItemId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    if (!member) return NextResponse.json({ error: "Not a member of this plan" }, { status: 403 });

    // Which departments this person is even allowed to view extension requests for
    let visibleDeptIds: string[] | null = null; // null = all (ADMIN/CO_ADMIN)
    if (member.role === "MANAGER") {
      const depts = await prisma.departmentMember.findMany({
        where: { workItemMemberId: member.id },
        select: { departmentId: true },
      });
      visibleDeptIds = depts.map((d) => d.departmentId);
    } else if (member.role !== "ADMIN" && member.role !== "CO_ADMIN") {
      // members / co-managers never see these buttons — return empty counts
      return NextResponse.json({ success: true, data: { byDepartment: {}, byMilestone: {} } });
    }

    const pending = await prisma.extensionRequest.findMany({
      where: {
        workItemId,
        status: "PENDING",
        ...(visibleDeptIds ? { departmentId: { in: visibleDeptIds } } : {}),
      },
      select: { departmentId: true, targetType: true, milestoneId: true },
    });

    const byDepartment: Record<string, number> = {};
    const byMilestone: Record<string, number> = {};

    for (const r of pending) {
      if (r.departmentId) {
        byDepartment[r.departmentId] = (byDepartment[r.departmentId] ?? 0) + 1;
      }
      if (r.targetType === "MILESTONE" && r.milestoneId) {
        byMilestone[r.milestoneId] = (byMilestone[r.milestoneId] ?? 0) + 1;
      }
    }

    return NextResponse.json({ success: true, data: { byDepartment, byMilestone } });
  } catch (error) {
    console.error("[GET .../extension-requests/pending-counts] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}