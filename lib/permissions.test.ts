import { describe, it, expect } from "vitest";
import { getPermissions, type CoAdminPermissions, type ManagerPermissions, type CoManagerPermissions } from "./permissions";
import type { CurrentPlanMeta } from "./store";

function meta(overrides: Partial<CurrentPlanMeta>): CurrentPlanMeta {
  return {
    role: "MEMBER",
    departmentIds: null,
    permissions: null,
    ...overrides,
  } as CurrentPlanMeta;
}

describe("role baselines — canDeleteMilestone", () => {
  it("OWNER can delete", () => {
    expect(getPermissions(meta({ role: "OWNER" })).canDeleteMilestone).toBe(true);
  });
  it("ADMIN can delete", () => {
    expect(getPermissions(meta({ role: "ADMIN" })).canDeleteMilestone).toBe(true);
  });
  it("CO_ADMIN cannot delete, even with no explicit denial", () => {
    expect(getPermissions(meta({ role: "CO_ADMIN" })).canDeleteMilestone).toBe(false);
  });
  it("MANAGER cannot delete", () => {
    expect(getPermissions(meta({ role: "MANAGER" })).canDeleteMilestone).toBe(false);
  });
  it("MEMBER cannot delete", () => {
    expect(getPermissions(meta({ role: "MEMBER" })).canDeleteMilestone).toBe(false);
  });
});

describe("canAddTask — department scoping", () => {
  it("OWNER/ADMIN can add regardless of department", () => {
    expect(getPermissions(meta({ role: "ADMIN" })).canAddTask("dept-1")).toBe(true);
  });
  it("CO_ADMIN can add regardless of department (no scoping in current model)", () => {
    expect(getPermissions(meta({ role: "CO_ADMIN" })).canAddTask("dept-1")).toBe(true);
  });
  it("MANAGER can add only within their scoped departments", () => {
    const perms = getPermissions(meta({ role: "MANAGER", departmentIds: ["dept-1"] }));
    expect(perms.canAddTask("dept-1")).toBe(true);
    expect(perms.canAddTask("dept-2")).toBe(false);
  });
  it("MANAGER with unrestricted scope (null departmentIds) can add anywhere", () => {
    const perms = getPermissions(meta({ role: "MANAGER", departmentIds: null }));
    expect(perms.canAddTask("dept-99")).toBe(true);
  });
  it("MEMBER can never add a task", () => {
    expect(getPermissions(meta({ role: "MEMBER" })).canAddTask("dept-1")).toBe(false);
  });
});

describe("canDeleteTask — narrower than canAddTask", () => {
  it("OWNER/ADMIN/CO_ADMIN can delete", () => {
    expect(getPermissions(meta({ role: "ADMIN" })).canDeleteTask).toBe(true);
    expect(getPermissions(meta({ role: "CO_ADMIN" })).canDeleteTask).toBe(true);
  });
  it("MANAGER cannot delete, even within their own department", () => {
    const perms = getPermissions(meta({ role: "MANAGER", departmentIds: ["dept-1"] }));
    expect(perms.canDeleteTask).toBe(false);
  });
});

describe("canManageTicketing / canManageStalls — ADMIN/CO_ADMIN only", () => {
  it("MANAGER cannot manage ticketing even though they can check in attendees", () => {
    const perms = getPermissions(meta({ role: "MANAGER" }));
    expect(perms.canManageTicketing).toBe(false);
    expect(perms.canCheckInAttendee).toBe(true);
  });
  it("CO_MANAGER cannot manage stalls", () => {
    expect(getPermissions(meta({ role: "CO_MANAGER" })).canManageStalls).toBe(false);
  });
});

describe("canApproveHardwareRequest — deptId scoping + explicit grants", () => {
  const managerPerms: ManagerPermissions = {
    revenue: "NONE", expenses: "NONE", reports: "NONE",
    canApproveExtensionRequests: false, canManageCoManagerPermissions: false,
    hardware: "NONE", canApproveHardwareRequests: true,
  };

  it("MANAGER with canApproveHardwareRequests=true can approve within scope", () => {
    const perms = getPermissions(meta({ role: "MANAGER", departmentIds: ["dept-1"], permissions: managerPerms }));
    expect(perms.canApproveHardwareRequest("dept-1")).toBe(true);
    expect(perms.canApproveHardwareRequest("dept-2")).toBe(false);
  });

  it("MANAGER without the grant cannot approve, even in scope", () => {
    const perms = getPermissions(meta({
      role: "MANAGER", departmentIds: ["dept-1"],
      permissions: { ...managerPerms, canApproveHardwareRequests: false },
    }));
    expect(perms.canApproveHardwareRequest("dept-1")).toBe(false);
  });

  it("CO_ADMIN needs the granular hardware.approve flag", () => {
    const withApprove: CoAdminPermissions = {
      members: { edit: false, delete: false },
      departments: { edit: false, delete: false },
      phases: { edit: false, delete: false },
      revenue: { create: false, edit: false, delete: false },
      expenses: { create: false, edit: false, delete: false, approve: false },
      reports: { create: false, edit: false, delete: false },
      hardware: { edit: false, delete: false, approve: true },
      extensions: { approve: false },
      canManagePermissions: false,
    };
    expect(getPermissions(meta({ role: "CO_ADMIN", permissions: withApprove })).canApproveHardwareRequest(null)).toBe(true);
    expect(getPermissions(meta({ role: "CO_ADMIN", permissions: { ...withApprove, hardware: { ...withApprove.hardware, approve: false } } })).canApproveHardwareRequest(null)).toBe(false);
  });
});

describe("canApproveTaskSubmission — CO_MANAGER needs explicit grant", () => {
  const coManagerPerms: CoManagerPermissions = {
    revenue: "NONE", expenses: "NONE", reports: "NONE",
    canRequestExtension: false, canApproveTaskSubmissions: true,
    hardware: "NONE", canApproveHardwareRequests: false,
  };

  it("CO_MANAGER with the grant can approve within scope", () => {
    const perms = getPermissions(meta({ role: "CO_MANAGER", departmentIds: ["dept-1"], permissions: coManagerPerms }));
    expect(perms.canApproveTaskSubmission("dept-1")).toBe(true);
    expect(perms.canApproveTaskSubmission("dept-2")).toBe(false);
  });

  it("CO_MANAGER without the grant cannot approve", () => {
    const perms = getPermissions(meta({
      role: "CO_MANAGER", departmentIds: ["dept-1"],
      permissions: { ...coManagerPerms, canApproveTaskSubmissions: false },
    }));
    expect(perms.canApproveTaskSubmission("dept-1")).toBe(false);
  });

  it("MANAGER always can approve within scope, no grant needed", () => {
    expect(getPermissions(meta({ role: "MANAGER", departmentIds: ["dept-1"] })).canApproveTaskSubmission("dept-1")).toBe(true);
  });
});

describe("canSubmitTaskWork — only the assignee", () => {
  it("returns true only when isAssignedToMe is true, regardless of role", () => {
    const perms = getPermissions(meta({ role: "MEMBER" }));
    expect(perms.canSubmitTaskWork(true)).toBe(true);
    expect(perms.canSubmitTaskWork(false)).toBe(false);
  });
});

describe("canExtendMilestoneDirectly vs canRequestMilestoneExtension", () => {
  it("MANAGER can request but not extend directly", () => {
    const perms = getPermissions(meta({ role: "MANAGER", departmentIds: ["dept-1"] }));
    expect(perms.canExtendMilestoneDirectly()).toBe(false);
    expect(perms.canRequestMilestoneExtension("dept-1")).toBe(true);
  });
  it("ADMIN can extend directly without going through a request", () => {
    expect(getPermissions(meta({ role: "ADMIN" })).canExtendMilestoneDirectly()).toBe(true);
  });
});