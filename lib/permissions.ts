import type { CurrentPlanMeta } from "./store";

export type PlanRole = "OWNER" | "ADMIN" | "CO_ADMIN" | "MANAGER" | "CO_MANAGER" | "MEMBER";

export interface PlanPermissions {
  // departments
  canAddDepartment: boolean;
  canEditDepartment: (deptId: string) => boolean;
  canDeleteDepartment: boolean;
  // phases
  canAddPhase: (deptId: string) => boolean;
  canEditPhase: (deptId: string) => boolean;
  canDeletePhase: boolean;
  // milestones
  canAddMilestone: boolean;
  canEditMilestone: boolean;
  canDeleteMilestone: boolean;
  // income / expenses
  canAddIncome: boolean;
  canEditIncome: boolean;
  canDeleteIncome: boolean;
  canAddExpense: boolean;
  canEditExpense: boolean;
  canDeleteExpense: boolean;
  // members
  canInviteMember: boolean;
  canEditMember: boolean;
  canDeleteMember: boolean;
  // tasks
  canAddTask: (deptId?: string) => boolean;
  canDeleteTask: boolean;
  canCompleteTask: boolean;
}

export function getPermissions(meta: CurrentPlanMeta | null): PlanPermissions {
  const role = (meta?.role ?? "MEMBER") as PlanRole;
  // deptIds is null for owner/admin (sees all), or string[] scoped to their dept
  const scopedDeptIds = meta?.departmentIds ?? null;

  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";
  const isCoAdmin = role === "CO_ADMIN";
  const isManager = role === "MANAGER";
  const isCoManager = role === "CO_MANAGER";

  const inScope = (deptId: string) =>
    scopedDeptIds === null || scopedDeptIds.includes(deptId);

  return {
    // departments
    canAddDepartment: isOwnerOrAdmin || isCoAdmin,
    canEditDepartment: (deptId) =>
      isOwnerOrAdmin || isCoAdmin || ((isManager) && inScope(deptId)),
    canDeleteDepartment: isOwnerOrAdmin,

    // phases
    canAddPhase: (deptId) =>
      isOwnerOrAdmin || isCoAdmin || ((isManager || isCoManager) && inScope(deptId)),
    canEditPhase: (deptId) =>
      isOwnerOrAdmin || isCoAdmin || ((isManager || isCoManager) && inScope(deptId)),
    canDeletePhase: isOwnerOrAdmin,

    // milestones
    canAddMilestone: isOwnerOrAdmin || isCoAdmin || isManager || isCoManager,
    canEditMilestone: isOwnerOrAdmin || isCoAdmin || isManager || isCoManager,
    canDeleteMilestone: isOwnerOrAdmin,

    // income
    canAddIncome: isOwnerOrAdmin || isCoAdmin || isManager,
    canEditIncome: isOwnerOrAdmin || isCoAdmin || isManager,
    canDeleteIncome: isOwnerOrAdmin || isCoAdmin,

    // expenses
    canAddExpense: isOwnerOrAdmin || isCoAdmin || isManager,
    canEditExpense: isOwnerOrAdmin || isCoAdmin || isManager,
    canDeleteExpense: isOwnerOrAdmin || isCoAdmin,

    // members
    canInviteMember: isOwnerOrAdmin || isCoAdmin,
    canEditMember: isOwnerOrAdmin,
    canDeleteMember: isOwnerOrAdmin,

    // tasks
    canAddTask: (deptId) =>
      isOwnerOrAdmin || isCoAdmin || (isManager && (!deptId || inScope(deptId))),
    canDeleteTask: isOwnerOrAdmin || isCoAdmin,
    canCompleteTask: true, // everyone
  };
}