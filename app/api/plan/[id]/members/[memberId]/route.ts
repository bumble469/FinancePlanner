import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: { planId: string; memberId: string } };

// ─── PATCH /api/plan/[planId]/members/[memberId] ───────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, memberId } = await params;
    const body = await req.json();
    const { role, departmentIds, monthlyCost } = body;

    const workItem = await prisma.workItem.findFirst({
      where: {
        id: planId,
        account: { userId: user.sub },
      },
    });

    if (!workItem) {
      return NextResponse.json({ error: "Work item not found" }, { status: 404 });
    }

    const existing = await prisma.workItemMember.findFirst({
      where: { id: memberId, workItemId: planId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.workItemMember.update({
        where: { id: memberId },
        data: { role, monthlyCost },
      });

      if (Array.isArray(departmentIds)) {
        await tx.departmentMember.deleteMany({
          where: { workItemMemberId: memberId },
        });

        // Re-create with the new set
        if (departmentIds.length > 0) {
          await tx.departmentMember.createMany({
            data: departmentIds.map((departmentId: string) => ({
              departmentId,
              userId: existing.userId,
              workItemMemberId: memberId,
            })),
          });
        }
      }

      return tx.workItemMember.findUnique({
        where: { id: memberId },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          departmentMembers: {
            include: {
              department: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /members/:memberId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/plan/[planId]/members/[memberId] ──────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, memberId } = await params;

    const workItem = await prisma.workItem.findFirst({
      where: {
        id: planId,
        account: { userId: user.sub },
      },
    });

    if (!workItem) {
      return NextResponse.json({ error: "Work item not found" }, { status: 404 });
    }

    const existing = await prisma.workItemMember.findFirst({
      where: { id: memberId, workItemId: planId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.departmentMember.deleteMany({
        where: { workItemMemberId: memberId },
      }),
      prisma.phaseMember.deleteMany({
        where: { workItemMemberId: memberId },
      }),
      prisma.workItemMember.delete({
        where: { id: memberId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /members/:memberId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}