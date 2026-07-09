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
    const { role, departmentIds, monthlyCost } = body;

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
        excludeMemberId: memberId,
      });
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
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
    if (updated?.userId) {
      emitToUser(updated.userId, "plan:member-updated", {
        planId,
        memberId: updated.id,
        role: updated.role,
        permissions: updated.permissions,
        departmentIds: updated.departmentMembers.map((d) => d.departmentId),
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