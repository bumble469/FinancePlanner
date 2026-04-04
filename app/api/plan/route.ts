import { NextRequest, NextResponse } from 'next/server';
import { WorkItemType, MemberRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const account = await prisma.account.findUnique({ where: { userId: user.sub } });
    if (!account) return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });

    const plans = await prisma.workItem.findMany({
      where: { accountId: account.id },
      include: {
        project: true,
        event: true,
        planInfo: true,
        departments: true,
        phases: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: plans }, { status: 200 });
  } catch (error) {
    console.error('[Plan GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/plan — create a new plan
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { userId: user.sub },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, type, budget } = body;

    // ✅ validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!type || !Object.values(WorkItemType).includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type. Must be PROJECT, EVENT or PLAN',
        },
        { status: 400 }
      );
    }

    if (!budget || isNaN(budget) || budget <= 0) {
      return NextResponse.json(
        { success: false, error: 'Budget must be a positive number' },
        { status: 400 }
      );
    }

    const plan = await prisma.$transaction(async (tx) => {
      // ✅ Create work item
      const workItem = await tx.workItem.create({
        data: {
          accountId: account.id,
          name: name.trim(),
          type,
          budget,
        },
      });

      // ✅ Add creator as OWNER in members table
      await tx.workItemMember.create({
        data: {
          workItemId: workItem.id,
          userId: user.sub,
          role: MemberRole.ADMIN,
        },
      });

      // ✅ Create type-specific table entry
      if (type === WorkItemType.PROJECT) {
        await tx.project.create({
          data: { workItemId: workItem.id },
        });
      } else if (type === WorkItemType.EVENT) {
        await tx.event.create({
          data: { workItemId: workItem.id },
        });
      } else if (type === WorkItemType.PLAN) {
        await tx.planInfo.create({
          data: { workItemId: workItem.id },
        });
      }

      // ✅ Return full data
      return tx.workItem.findUnique({
        where: { id: workItem.id },
        include: {
          project: true,
          event: true,
          planInfo: true,
          departments: true,
          phases: true,
          members: true, // include members if relation exists
        },
      });
    });

    return NextResponse.json(
      { success: true, data: plan },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Plan POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}