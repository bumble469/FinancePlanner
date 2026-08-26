import { prisma } from "@/lib/prisma";
import { getPermissions, type PlanPermissions, type PlanRole } from "@/lib/permissions";

export interface PlanAccess {
  isOwner: boolean;
  role: PlanRole;
  memberId: string | null;
  departmentIds: string[] | null;
  permissions: PlanPermissions;
}

export async function getPlanAccess(planId: string, userId: string): Promise<PlanAccess | null> {
  const account = await prisma.account.findUnique({ where: { userId } });

  if (account) {
    const owns = await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } });
    if (owns) {
      return {
        isOwner: true,
        role: "OWNER",
        memberId: null,
        departmentIds: null,
        permissions: getPermissions({ role: "OWNER", departmentIds: null, permissions: null } as any),
      };
    }
  }

  const membership = await prisma.workItemMember.findFirst({
    where: { workItemId: planId, userId },
    include: { departmentMembers: { select: { departmentId: true } } },
  });
  if (!membership) return null;

  const departmentIds = membership.departmentMembers.map((d) => d.departmentId);

  return {
    isOwner: false,
    role: membership.role as PlanRole,
    memberId: membership.id,
    departmentIds,
    permissions: getPermissions({
      role: membership.role,
      departmentIds,
      permissions: membership.permissions as any,
    } as any),
  };
}