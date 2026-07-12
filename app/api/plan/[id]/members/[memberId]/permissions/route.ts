import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import {
  canEditPermissionsOf,
  DEFAULT_CO_ADMIN_PERMISSIONS,
  DEFAULT_MANAGER_PERMISSIONS,
  DEFAULT_CO_MANAGER_PERMISSIONS,
  type CoAdminPermissions,
  type ManagerPermissions,
  type CoManagerPermissions,
} from "@/lib/permissions";
import type { MemberRole } from "@prisma/client";
import { emitToUser } from "@/lib/socket-server";
import { notify } from "@/lib/notify";

type Params = { params: Promise<{ id: string; memberId: string }> };

// ─── PATCH /api/plan/[id]/members/[memberId]/permissions ──────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, memberId } = await params;
    const body = await req.json();
    const { permissions: newPermissions } = body;

    if (!newPermissions || typeof newPermissions !== "object") {
      return NextResponse.json({ error: "Invalid permissions payload" }, { status: 400 });
    }

    // ── 1. Resolve acting identity ────────────────────────────────────────
    const account = await prisma.account.findUnique({ where: { userId: user.sub } });
    const isOwner = account
      ? !!(await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } }))
      : false;

    let actingMemberId: string | null = null;
    let actingRole: MemberRole | "OWNER" = "OWNER";
    let actingPermissions: unknown = null;
    let actingDeptIds: string[] = [];

    if (isOwner) {
      const ownerMember = await prisma.workItemMember.findFirst({
        where: { workItemId: planId, userId: user.sub },
      });
      actingMemberId = ownerMember?.id ?? null;
    } else {
      const actingMember = await prisma.workItemMember.findFirst({
        where: { workItemId: planId, userId: user.sub },
        include: { departmentMembers: { select: { departmentId: true } } },
      });

      if (!actingMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      actingMemberId = actingMember.id;
      actingRole = actingMember.role;
      actingPermissions = actingMember.permissions;
      actingDeptIds = actingMember.departmentMembers.map((d) => d.departmentId);
    }

    // ── 2. Get target member ──────────────────────────────────────────────
    const targetMember = await prisma.workItemMember.findFirst({
      where: { id: memberId, workItemId: planId },
      include: { departmentMembers: { select: { departmentId: true } } },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const targetRole = targetMember.role;

    if (targetRole === "ADMIN" || targetRole === "MEMBER") {
      return NextResponse.json(
        { error: "Permissions for this role are not configurable" },
        { status: 400 }
      );
    }

    // ── 3. Authorization check ────────────────────────────────────────────
    const authorized =
      isOwner ||
      (actingRole !== "OWNER" &&
        canEditPermissionsOf(
          {
            role: actingRole as MemberRole,
            permissions: actingPermissions as CoAdminPermissions | ManagerPermissions | null,
          },
          targetRole as "CO_ADMIN" | "MANAGER" | "CO_MANAGER"
        ));

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // MANAGER can only edit CO_MANAGER in their own dept
    if (actingRole === "MANAGER" && targetRole === "CO_MANAGER") {
      const targetDeptIds = targetMember.departmentMembers.map((d) => d.departmentId);
      const overlap = actingDeptIds.some((id) => targetDeptIds.includes(id));
      if (!overlap) {
        return NextResponse.json(
          { error: "You can only manage permissions for co-managers in your department" },
          { status: 403 }
        );
      }
    }

    // ── 4. Merge against role default (strips unknown keys, fills missing ones) ─
    let validatedPermissions: CoAdminPermissions | ManagerPermissions | CoManagerPermissions;

    if (targetRole === "CO_ADMIN") {
      validatedPermissions = { ...DEFAULT_CO_ADMIN_PERMISSIONS, ...newPermissions } as CoAdminPermissions;
    } else if (targetRole === "MANAGER") {
      validatedPermissions = { ...DEFAULT_MANAGER_PERMISSIONS, ...newPermissions } as ManagerPermissions;
    } else {
      validatedPermissions = { ...DEFAULT_CO_MANAGER_PERMISSIONS, ...newPermissions } as CoManagerPermissions;
    }

    // ── 5. Persist + audit in one transaction ─────────────────────────────
    const updated = await prisma.$transaction(async (tx) => {
      const updatedMember = await tx.workItemMember.update({
        where: { id: memberId },
        data: { permissions: validatedPermissions as any },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          departmentMembers: {
            include: { department: { select: { id: true, name: true } } },
          },
        },
      });

      if (actingMemberId) {
        await tx.permissionAuditLog.create({
          data: {
            workItemId: planId,
            targetMemberId: memberId,
            changedById: actingMemberId,
            previousPermissions: targetMember.permissions ?? Prisma.JsonNull,
            newPermissions: validatedPermissions as any,
          },
        });
      }

      return updatedMember;
    });
    if (updated.userId) {
      emitToUser(updated.userId, "plan:member-updated", {
        planId,
        memberId: updated.id,
        role: updated.role,
        permissions: updated.permissions,
        departmentIds: updated.departmentMembers.map((d) => d.departmentId),
      });
      await notify({
        workItemId: planId,
        userIds: [updated.userId],
        scope: "PERSONAL",
        type: "PERMISSIONS_UPDATED",
        title: "Your permissions were updated",
        message: `Your permissions on this plan have been changed.`,
        entityType: "member",
        entityId: updated.id,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /members/:memberId/permissions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/plan/[id]/members/[memberId]/permissions ────────────────────
// Returns audit log for this member. Only OWNER / ADMIN / CO_ADMIN can view.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, memberId } = await params;

    const account = await prisma.account.findUnique({ where: { userId: user.sub } });
    const isOwner = account
      ? !!(await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } }))
      : false;

    if (!isOwner) {
      const actingMember = await prisma.workItemMember.findFirst({
        where: { workItemId: planId, userId: user.sub },
        select: { role: true },
      });

      if (actingMember?.role !== "ADMIN" && actingMember?.role !== "CO_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const logs = await prisma.permissionAuditLog.findMany({
      where: { workItemId: planId, targetMemberId: memberId },
      orderBy: { createdAt: "desc" },
      include: {
        changedBy: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (err) {
    console.error("[GET /members/:memberId/permissions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}