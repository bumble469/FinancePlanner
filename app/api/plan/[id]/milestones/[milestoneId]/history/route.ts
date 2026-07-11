import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string; milestoneId: string }> };

// GET /api/plan/[id]/milestones/[milestoneId]/history
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workItemId, milestoneId } = await params;

    const membership = await prisma.workItemMember.findUnique({
      where: { workItemId_userId: { workItemId, userId: user.sub } },
    });
    const account = await prisma.account.findUnique({ where: { userId: user.sub } });
    const isOwner = account
      ? !!(await prisma.workItem.findFirst({ where: { id: workItemId, accountId: account.id } }))
      : false;

    if (!membership && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, workItemId },
      select: { id: true, title: true, originalDueDate: true, dueDate: true },
    });
    if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

    const logs = await prisma.milestoneExtensionLog.findMany({
      where: { milestoneId },
      orderBy: { createdAt: "asc" },
      include: {
        extendedBy: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        milestone: {
          id: milestone.id,
          title: milestone.title,
          originalDueDate: milestone.originalDueDate,
          currentDueDate: milestone.dueDate,
        },
        history: logs.map((log, index) => ({
          serial: index + 1,
          id: log.id,
          previousDueDate: log.previousDueDate,
          newDueDate: log.newDueDate,
          reason: log.reason,
          extendedByName: log.extendedBy?.user?.name ?? "Plan owner",
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error("[GET /milestones/:milestoneId/history]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}