import { NextRequest, NextResponse } from 'next/server';
import { WorkItemStatus } from '@prisma/client';
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
      phases: true,
    },
  });

  return plan;
}

// GET /api/plan/[id]
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

// PATCH /api/plan/[id] — update name, status, budget
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const existing = await getPlanAndVerifyOwner(params.id, user.sub);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });

    const body = await request.json();
    const { name, status, budget } = body;

    if (status && !Object.values(WorkItemStatus).includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.workItem.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(status && { status }),
        ...(budget && { budget }),
      },
      include: {
        project: true,
        event: true,
        planInfo: true,
        departments: true,
        phases: true,
      },
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('[Plan PATCH/:id] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/plan/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const existing = await getPlanAndVerifyOwner((await params).id, user.sub);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });

    await prisma.workItem.delete({ where: { id: (await params).id } });
    // cascades to project/event/planInfo/departments/phases automatically

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[Plan DELETE/:id] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}