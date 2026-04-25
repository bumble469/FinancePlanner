import { NextRequest, NextResponse } from 'next/server';
import { WorkItemStatus, WorkItemType, MemberRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

async function getPlanAndVerifyOwner(planId: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) return null;

  const plan = await prisma.workItem.findFirst({
    where: { id: planId, accountId: account.id },
    include: {
      project: true,
      event: true,
      planInfo: true,
      departments: true,
      tasks: true,
      milestones: {
        include: {
          tasks: {
            include: {
              task: true,
            },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      phases: true,
      members: {
        include: {
          user: {
            select: { name: true, email: true, image: true },
          },
          departmentMembers: {
            include: {
              department: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });
  
  if (!plan) return null;
  const formattedPlan = {
    ...plan,
    milestones: plan.milestones.map((m) => ({
      ...m,
      tasks: m.tasks.map((mt) => ({
        id: mt.task.id,
        title: mt.task.title,
        status: mt.task.status,
      })),
    })),
  };

  return formattedPlan;
}

// ─── GET /api/plan/[id] ────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const plan = await getPlanAndVerifyOwner(params.id, user.sub);
    if (!plan) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: plan }, { status: 200 });
  } catch (error) {
    console.error('[Plan GET/:id] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH /api/plan/[id] ──────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params;

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Missing plan ID' }, { status: 400 });
    }

    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const existing = await getPlanAndVerifyOwner(planId, user.sub);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });

    const body = await request.json();
    const {
      name, status, budget, description, currency,
      startDate, endDate, methodology,
      eventDate, venue,
    } = body;

    if (status && !Object.values(WorkItemStatus).includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // update base workItem
      await tx.workItem.update({
        where: { id: planId },
        data: {
          ...(name        ? { name: name.trim() } : {}),
          ...(status      ? { status }             : {}),
          ...(budget !== undefined ? { budget }    : {}),
          ...(description !== undefined ? { description: description?.trim() || null } : {}),
          ...(currency    ? { currency }            : {}),
        },
      });

      // update type-specific record
      if (existing.type === WorkItemType.PROJECT) {
        await tx.project.update({
          where: { workItemId: planId },
          data: {
            ...(startDate   !== undefined ? { startDate: startDate ? new Date(startDate) : null }   : {}),
            ...(endDate    !== undefined ? { endDate: endDate ? new Date(endDate) : null }       : {}),
            ...(methodology !== undefined ? { methodology: methodology?.trim() || null }             : {}),
          },
        });
      } else if (existing.type === WorkItemType.EVENT) {
        await tx.event.update({
          where: { workItemId: planId },
          data: {
            ...(eventDate !== undefined ? { eventDate: eventDate ? new Date(eventDate) : null } : {}),
            ...(venue     !== undefined ? { venue: venue?.trim() || null }                      : {}),
          },
        });
      }

      return tx.workItem.findUnique({
        where: { id: planId },
        include: {
          project: true,
          event: true,
          planInfo: true,
          departments: true,
          phases: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('[Plan PATCH/:id] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/plan/[id] ─────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params;

    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const existing = await getPlanAndVerifyOwner(planId, user.sub);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });

    // cascades to project/event/planInfo/departments/phases/members automatically
    await prisma.workItem.delete({ where: { id: planId } });

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[Plan DELETE/:id] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}