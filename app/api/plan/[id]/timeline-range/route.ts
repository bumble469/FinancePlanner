import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/plan/[id]/timeline-range
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId } = await params;

    const membership = await prisma.workItemMember.findFirst({
      where: { workItemId: planId, userId: user.sub },
    });
    const account = await prisma.account.findUnique({ where: { userId: user.sub } });
    const isOwner = account
      ? !!(await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } }))
      : false;

    if (!membership && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({ where: { workItemId: planId } });

    if (project?.startDate && project?.endDate) {
      return NextResponse.json({
        success: true,
        data: { start: project.startDate, end: project.endDate, source: "project" },
      });
    }

    const [milestoneDates, taskDates] = await Promise.all([
      prisma.milestone.findMany({
        where: { workItemId: planId, dueDate: { not: null } },
        select: { dueDate: true },
      }),
      prisma.task.findMany({
        where: { workItemId: planId, OR: [{ startDate: { not: null } }, { dueDate: { not: null } }] },
        select: { startDate: true, dueDate: true },
      }),
    ]);

    const allDates = [
      ...milestoneDates.map((m) => m.dueDate!),
      ...taskDates.flatMap((t) => [t.startDate, t.dueDate].filter(Boolean) as Date[]),
    ];

    if (allDates.length > 0) {
      const start = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const end = new Date(Math.max(...allDates.map((d) => d.getTime())));
      return NextResponse.json({ success: true, data: { start, end, source: "derived" } });
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    return NextResponse.json({ success: true, data: { start, end, source: "fallback" } });
  } catch (err) {
    console.error("[GET /timeline-range]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}