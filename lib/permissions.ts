import type { CurrentPlanMeta } from "./store";
import type { MemberRole } from "@prisma/client";
export type PlanRole = "OWNER" | "ADMIN" | "CO_ADMIN" | "MANAGER" | "CO_MANAGER" | "MEMBER";
export type AccessLevel = "NONE" | "VIEW" | "MANAGE";

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

  canAddReport: boolean;
  canDeleteReport: boolean;
}

export function getPermissions(meta: CurrentPlanMeta | null): PlanPermissions {
  const role = (meta?.role ?? "MEMBER") as PlanRole;
  const scopedDeptIds = meta?.departmentIds ?? null;
  const rawPerms = meta?.permissions ?? null;

  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";
  const isCoAdmin = role === "CO_ADMIN";
  const isManager = role === "MANAGER";
  const isCoManager = role === "CO_MANAGER";

  const inScope = (deptId: string) =>
    scopedDeptIds === null || scopedDeptIds.includes(deptId);

  // typed permission accessors — safe cast based on role
  const coAdminPerms = isCoAdmin ? (rawPerms as CoAdminPermissions | null) : null;
  const managerPerms = isManager ? (rawPerms as ManagerPermissions | null) : null;
  const coManagerPerms = isCoManager ? (rawPerms as CoManagerPermissions | null) : null;

  // CO_ADMIN helpers
  const ca = (key: keyof CoAdminPermissions, subKey?: string): boolean => {
    if (!coAdminPerms) return false;
    const val = coAdminPerms[key];
    if (subKey && typeof val === "object" && val !== null) {
      return !!(val as Record<string, boolean>)[subKey];
    }
    return !!val;
  };

  // MANAGER / CO_MANAGER helpers — check AccessLevel
  const managerCan = (key: keyof ManagerPermissions, level: "VIEW" | "MANAGE"): boolean => {
    if (!managerPerms) return false;
    const val = managerPerms[key] as AccessLevel | boolean;
    if (level === "VIEW") return val === "VIEW" || val === "MANAGE";
    return val === "MANAGE";
  };

  const coManagerCan = (key: keyof CoManagerPermissions, level: "VIEW" | "MANAGE"): boolean => {
    if (!coManagerPerms) return false;
    const val = coManagerPerms[key] as AccessLevel;
    if (level === "VIEW") return val === "VIEW" || val === "MANAGE";
    return val === "MANAGE";
  };

  return {
    // ── departments ──
    canAddDepartment: isOwnerOrAdmin || ca("departments", "edit"), // edit = can mutate structure
    canEditDepartment: (deptId) =>
      isOwnerOrAdmin ||
      ca("departments", "edit") ||
      (isManager && inScope(deptId)),
    canDeleteDepartment: isOwnerOrAdmin || ca("departments", "delete"),

    // ── phases ──
    canAddPhase: (deptId) =>
      isOwnerOrAdmin ||
      ca("phases", "edit") ||
      ((isManager || isCoManager) && inScope(deptId)),
    canEditPhase: (deptId) =>
      isOwnerOrAdmin ||
      ca("phases", "edit") ||
      ((isManager || isCoManager) && inScope(deptId)),
    canDeletePhase: isOwnerOrAdmin || ca("phases", "delete"),

    // ── milestones ──
    canAddMilestone: isOwnerOrAdmin || isCoAdmin || isManager || isCoManager,
    canEditMilestone: isOwnerOrAdmin || isCoAdmin || isManager || isCoManager,
    canDeleteMilestone: isOwnerOrAdmin,

    // ── income ──
    canAddIncome:
      isOwnerOrAdmin ||
      ca("revenue", "create") ||
      (isManager && managerCan("revenue", "MANAGE")) ||
      (isCoManager && coManagerCan("revenue", "MANAGE")),
    canEditIncome:
      isOwnerOrAdmin ||
      ca("revenue", "edit") ||
      (isManager && managerCan("revenue", "MANAGE")) ||
      (isCoManager && coManagerCan("revenue", "MANAGE")),
    canDeleteIncome:
      isOwnerOrAdmin ||
      ca("revenue", "delete") ||
      (isManager && managerCan("revenue", "MANAGE")) ||
      (isCoManager && coManagerCan("revenue", "MANAGE")),

    // ── expenses ──
    canAddExpense:
      isOwnerOrAdmin ||
      ca("expenses", "create") ||
      (isManager && managerCan("expenses", "MANAGE")) ||
      (isCoManager && coManagerCan("expenses", "MANAGE")),
    canEditExpense:
      isOwnerOrAdmin ||
      ca("expenses", "edit") ||
      (isManager && managerCan("expenses", "MANAGE")) ||
      (isCoManager && coManagerCan("expenses", "MANAGE")),
    canDeleteExpense:
      isOwnerOrAdmin ||
      ca("expenses", "delete") ||
      (isManager && managerCan("expenses", "MANAGE")) ||
      (isCoManager && coManagerCan("expenses", "MANAGE")),

    // ── members ──
    canInviteMember: isOwnerOrAdmin || isCoAdmin,
    canEditMember: isOwnerOrAdmin || ca("members", "edit"),
    canDeleteMember: isOwnerOrAdmin || ca("members", "delete"),

    // ── tasks ──
    canAddTask: (deptId) =>
      isOwnerOrAdmin ||
      isCoAdmin ||
      (isManager && (!deptId || inScope(deptId))),
    canDeleteTask: isOwnerOrAdmin || isCoAdmin,
    canCompleteTask: true,

    canAddReport:
      isOwnerOrAdmin ||
      ca("reports", "create") ||
      (isManager && managerCan("reports", "MANAGE")) ||
      (isCoManager && coManagerCan("reports", "MANAGE")),

    canDeleteReport:
      isOwnerOrAdmin ||
      ca("reports", "delete") ||
      (isManager && managerCan("reports", "MANAGE")) ||
      (isCoManager && coManagerCan("reports", "MANAGE")),
  };
}

export interface CoAdminPermissions {
  members: { edit: boolean; delete: boolean };
  departments: { edit: boolean; delete: boolean };
  phases: { edit: boolean; delete: boolean };
  revenue: { create: boolean; edit: boolean; delete: boolean };
  expenses: { create: boolean; edit: boolean; delete: boolean };
  reports: { create: boolean; edit: boolean; delete: boolean };
  canManagePermissions: boolean; 
}

export interface ManagerPermissions {
  revenue: AccessLevel;
  expenses: AccessLevel;
  reports: AccessLevel;
  canManageCoManagerPermissions: boolean; 
}

export interface CoManagerPermissions {
  revenue: AccessLevel;
  expenses: AccessLevel;
  reports: AccessLevel;
}

export const DEFAULT_CO_ADMIN_PERMISSIONS: CoAdminPermissions = {
  members: { edit: false, delete: false },
  departments: { edit: false, delete: false },
  phases: { edit: false, delete: false },
  revenue: { create: false, edit: false, delete: false },
  expenses: { create: false, edit: false, delete: false },
  reports: { create: false, edit: false, delete: false },
  canManagePermissions: false,
};

export const DEFAULT_MANAGER_PERMISSIONS: ManagerPermissions = {
  revenue: "NONE",
  expenses: "NONE",
  reports: "NONE",
  canManageCoManagerPermissions: false,
};

export const DEFAULT_CO_MANAGER_PERMISSIONS: CoManagerPermissions = {
  revenue: "NONE",
  expenses: "NONE",
  reports: "NONE",
};

type ActingMember = { role: MemberRole; permissions: CoAdminPermissions | ManagerPermissions | null };

export function canEditPermissionsOf(
  acting: ActingMember,
  targetRole: "CO_ADMIN" | "MANAGER" | "CO_MANAGER"
): boolean {
  if (acting.role === "ADMIN") return true;

  if (acting.role === "CO_ADMIN" && targetRole === "MANAGER") {
    return (acting.permissions as CoAdminPermissions | null)?.canManagePermissions === true;
  }

  if (acting.role === "MANAGER" && targetRole === "CO_MANAGER") {
    return (acting.permissions as ManagerPermissions | null)?.canManageCoManagerPermissions === true;
  }

  return false;
}


