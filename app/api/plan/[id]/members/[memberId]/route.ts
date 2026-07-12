import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import {
  DEFAULT_CO_ADMIN_PERMISSIONS,
  DEFAULT_MANAGER_PERMISSIONS,
  DEFAULT_CO_MANAGER_PERMISSIONS,
} from "@/lib/permissions";
import { emitToUser } from "@/lib/socket-server";
import { validateMemberBudget } from "@/lib/budget-validation";
import { notify, getDepartmentMemberUserIds } from "@/lib/notify";

type Params = { params: Promise<{ id: string; memberId: string }> };

// ─── PATCH /api/plan/[planId]/members/[memberId] ───────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId, memberId } = await params;
    const body = await req.json();
    const { role, departmentIds, monthlyCost, departmentCostShares } = body;

    // Check owner first
    const account = await prisma.account.findUnique({ where: { userId: user.sub } });
    const ownedWorkItem = account
      ? await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } })
      : null;

    if (!ownedWorkItem) {
      const actingMember = await prisma.workItemMember.findFirst({
        where: { workItemId: planId, userId: user.sub },
        select: { role: true, permissions: true },
      });

      const canEdit =
        actingMember?.role === "ADMIN" ||
        (actingMember?.role === "CO_ADMIN" &&
          !!(actingMember.permissions as any)?.members?.edit === true);

      if (!canEdit) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const existing = await prisma.workItemMember.findFirst({
      where: { id: memberId, workItemId: planId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const effectiveRole = role ?? existing.role;
    const effectiveMonthlyCost = monthlyCost !== undefined ? Number(monthlyCost) : Number(existing.monthlyCost ?? 0);
    const effectiveDeptIds: string[] = Array.isArray(departmentIds)
      ? departmentIds
      : (await prisma.departmentMember.findMany({
        where: { workItemMemberId: memberId },
        select: { departmentId: true },
      })).map((d) => d.departmentId);

    if (effectiveMonthlyCost > 0) {
      const check = await validateMemberBudget({
        planId,
        role: effectiveRole,
        departmentIds: effectiveDeptIds,
        monthlyCost: effectiveMonthlyCost,
        departmentShares: departmentCostShares,
        excludeMemberId: memberId,
      });
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

    if (Array.isArray(departmentIds) && departmentIds.length > 1) {
      if (!departmentCostShares) {
        return NextResponse.json({ error: "Please specify how much of the monthly cost goes to each department" }, { status: 400 });
      }
      const sharesSum = departmentIds.reduce((sum: number, id: string) => sum + Number(departmentCostShares[id] ?? 0), 0);
      const expectedTotal = Number(effectiveMonthlyCost);
      if (Math.abs(sharesSum - expectedTotal) > 0.01) {
        return NextResponse.json({
          error: `Department cost shares must add up to the total monthly cost. Got ₹${sharesSum.toLocaleString("en-IN")}, expected ₹${expectedTotal.toLocaleString("en-IN")}.`,
        }, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      let newPermissions = existing.permissions;
      if (role && role !== existing.role) {
        if (role === "CO_ADMIN") newPermissions = DEFAULT_CO_ADMIN_PERMISSIONS as any;
        else if (role === "MANAGER") newPermissions = DEFAULT_MANAGER_PERMISSIONS as any;
        else if (role === "CO_MANAGER") newPermissions = DEFAULT_CO_MANAGER_PERMISSIONS as any;
        else newPermissions = null;
      }

      await tx.workItemMember.update({
        where: { id: memberId },
        data: { role, monthlyCost, permissions: newPermissions as any },
      });


      if (Array.isArray(departmentIds)) {
        await tx.departmentMember.deleteMany({
          where: { workItemMemberId: memberId },
        });

        if (departmentIds.length > 0) {
          await tx.departmentMember.createMany({
            data: departmentIds.map((departmentId: string) => ({
              departmentId,
              userId: existing.userId,
              workItemMemberId: memberId,
              costShare:
                departmentIds.length === 1
                  ? effectiveMonthlyCost
                  : Number(departmentCostShares?.[departmentId] ?? 0),
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
    if (updated?.userId) {
      emitToUser(updated.userId, "plan:member-updated", {
        planId,
        memberId: updated.id,
        role: updated.role,
        permissions: updated.permissions,
        departmentIds: updated.departmentMembers.map((d) => d.departmentId),
      });
    }
    if (Array.isArray(departmentIds) && departmentIds.length > 0 && updated) {
      const existingDeptUserIds = await getDepartmentMemberUserIds(departmentIds, updated.userId);
      await notify({
        workItemId: planId,
        userIds: existingDeptUserIds,
        scope: "GENERAL",
        type: "MEMBER_JOINED_DEPARTMENT",
        title: "New team member",
        message: `${updated.user.name ?? "A new member"} joined your department.`,
        entityType: "member",
        entityId: updated.id,
      });
    }
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

    const { id: planId, memberId } = await params;

    // Check owner first
    const account = await prisma.account.findUnique({ where: { userId: user.sub } });
    const ownedWorkItem = account
      ? await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } })
      : null;

    if (!ownedWorkItem) {
      const actingMember = await prisma.workItemMember.findFirst({
        where: { workItemId: planId, userId: user.sub },
        select: { role: true, permissions: true },
      });

      const canDelete =
        actingMember?.role === "ADMIN" ||
        (actingMember?.role === "CO_ADMIN" &&
          !!(actingMember.permissions as any)?.members?.delete === true);

      if (!canDelete) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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