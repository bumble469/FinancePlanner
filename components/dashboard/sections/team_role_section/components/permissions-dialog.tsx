"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { useSnackbar } from "@/lib/useSnackbar";
import {
  DEFAULT_CO_ADMIN_PERMISSIONS,
  DEFAULT_MANAGER_PERMISSIONS,
  DEFAULT_CO_MANAGER_PERMISSIONS,
  type CoAdminPermissions,
  type ManagerPermissions,
  type CoManagerPermissions,
  type AccessLevel,
} from "@/lib/permissions";
import type { TeamMember } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  planId: string;
  onSaved: (updatedMember: any) => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function SwitchRow({
  label,
  checked,
  onCheckedChange,
  description,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function AccessSelect({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: AccessLevel;
  onChange: (v: AccessLevel) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as AccessLevel)}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NONE">None</SelectItem>
          <SelectItem value="VIEW">View</SelectItem>
          <SelectItem value="MANAGE">Manage</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function PermissionsDialog({ open, onOpenChange, member, planId, onSaved }: Props) {
  const { show } = useSnackbar();
  const [saving, setSaving] = useState(false);
  const role = member.role as string;

  // initialise from existing permissions or defaults
  const [coAdminPerms, setCoAdminPerms] = useState<CoAdminPermissions>(
    () => ({ ...DEFAULT_CO_ADMIN_PERMISSIONS, ...(member.permissions as any) })
  );
  const [managerPerms, setManagerPerms] = useState<ManagerPermissions>(
    () => ({ ...DEFAULT_MANAGER_PERMISSIONS, ...(member.permissions as any) })
  );
  const [coManagerPerms, setCoManagerPerms] = useState<CoManagerPermissions>(
    () => ({ ...DEFAULT_CO_MANAGER_PERMISSIONS, ...(member.permissions as any) })
  );

  // re-sync when the member changes (e.g. dialog opened for a different member)
  useEffect(() => {
    if (!open) return;
    setCoAdminPerms({ ...DEFAULT_CO_ADMIN_PERMISSIONS, ...(member.permissions as any) });
    setManagerPerms({ ...DEFAULT_MANAGER_PERMISSIONS, ...(member.permissions as any) });
    setCoManagerPerms({ ...DEFAULT_CO_MANAGER_PERMISSIONS, ...(member.permissions as any) });
  }, [open, member]);

  const handleSave = async () => {
    const payload =
      role === "CO_ADMIN"
        ? coAdminPerms
        : role === "MANAGER"
        ? managerPerms
        : coManagerPerms;

    try {
      setSaving(true);
      const res = await authClient.request(
        `/api/plan/${planId}/members/${member.id}/permissions`,
        { method: "PATCH", data: { permissions: payload } }
      );
      onSaved(res.data.data);
      show("Permissions saved", "success");
      onOpenChange(false);
    } catch (err: any) {
      show(err?.response?.data?.error || "Failed to save permissions", "error");
    } finally {
      setSaving(false);
    }
  };

  const memberName = member.user?.name || member.user?.email || "Member";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Permissions — {memberName}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Role: <span className="font-medium">{role}</span>
          </p>
        </DialogHeader>

        <div className="mt-2">

          {/* ── CO_ADMIN ─────────────────────────────────────────────────── */}
          {role === "CO_ADMIN" && (
            <Tabs defaultValue="members">
              <TabsList className="w-full">
                <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
                <TabsTrigger value="structure" className="flex-1">Structure</TabsTrigger>
                <TabsTrigger value="financials" className="flex-1">Financials</TabsTrigger>
                <TabsTrigger value="access" className="flex-1">Access</TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="divide-y divide-border">
                <SwitchRow
                  label="Edit members"
                  description="Can change member roles and departments"
                  checked={coAdminPerms.members.edit}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, members: { ...p.members, edit: v } }))
                  }
                />
                <SwitchRow
                  label="Delete members"
                  description="Can remove members from the plan"
                  checked={coAdminPerms.members.delete}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, members: { ...p.members, delete: v } }))
                  }
                />
              </TabsContent>

              <TabsContent value="structure" className="divide-y divide-border">
                <SwitchRow
                  label="Edit departments"
                  description="Can create and rename departments"
                  checked={coAdminPerms.departments.edit}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, departments: { ...p.departments, edit: v } }))
                  }
                />
                <SwitchRow
                  label="Delete departments"
                  checked={coAdminPerms.departments.delete}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, departments: { ...p.departments, delete: v } }))
                  }
                />
                <SwitchRow
                  label="Edit phases"
                  description="Can create and edit modules/phases"
                  checked={coAdminPerms.phases.edit}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, phases: { ...p.phases, edit: v } }))
                  }
                />
                <SwitchRow
                  label="Delete phases"
                  checked={coAdminPerms.phases.delete}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, phases: { ...p.phases, delete: v } }))
                  }
                />
              </TabsContent>

              <TabsContent value="financials" className="divide-y divide-border">
                <SwitchRow
                  label="Create revenue"
                  checked={coAdminPerms.revenue.create}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, revenue: { ...p.revenue, create: v } }))
                  }
                />
                <SwitchRow
                  label="Edit revenue"
                  checked={coAdminPerms.revenue.edit}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, revenue: { ...p.revenue, edit: v } }))
                  }
                />
                <SwitchRow
                  label="Delete revenue"
                  checked={coAdminPerms.revenue.delete}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, revenue: { ...p.revenue, delete: v } }))
                  }
                />
                <SwitchRow
                  label="Create expenses"
                  checked={coAdminPerms.expenses.create}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, expenses: { ...p.expenses, create: v } }))
                  }
                />
                <SwitchRow
                  label="Edit expenses"
                  checked={coAdminPerms.expenses.edit}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, expenses: { ...p.expenses, edit: v } }))
                  }
                />
                <SwitchRow
                  label="Delete expenses"
                  checked={coAdminPerms.expenses.delete}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, expenses: { ...p.expenses, delete: v } }))
                  }
                />
                <SwitchRow
                  label="Create reports/docs"
                  checked={coAdminPerms.reports.create}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, reports: { ...p.reports, create: v } }))
                  }
                />
                <SwitchRow
                  label="Edit reports/docs"
                  checked={coAdminPerms.reports.edit}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, reports: { ...p.reports, edit: v } }))
                  }
                />
                <SwitchRow
                  label="Delete reports/docs"
                  checked={coAdminPerms.reports.delete}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, reports: { ...p.reports, delete: v } }))
                  }
                />
              </TabsContent>

              <TabsContent value="access" className="divide-y divide-border">
                <SwitchRow
                  label="Can manage manager permissions"
                  description="Allows this co-admin to configure permissions for managers"
                  checked={coAdminPerms.canManagePermissions}
                  onCheckedChange={(v) =>
                    setCoAdminPerms((p) => ({ ...p, canManagePermissions: v }))
                  }
                />
              </TabsContent>
            </Tabs>
          )}

          {/* ── MANAGER ──────────────────────────────────────────────────── */}
          {role === "MANAGER" && (
            <div className="divide-y divide-border">
              <p className="text-xs text-muted-foreground pb-3">
                Applies to their assigned departments only.
                NONE = no access, VIEW = read-only, MANAGE = full CRUD.
              </p>
              <AccessSelect
                label="Revenue access"
                value={managerPerms.revenue}
                onChange={(v) => setManagerPerms((p) => ({ ...p, revenue: v }))}
              />
              <AccessSelect
                label="Expenses access"
                value={managerPerms.expenses}
                onChange={(v) => setManagerPerms((p) => ({ ...p, expenses: v }))}
              />
              <AccessSelect
                label="Reports & docs access"
                value={managerPerms.reports}
                onChange={(v) => setManagerPerms((p) => ({ ...p, reports: v }))}
              />
              <SwitchRow
                label="Can manage co-manager permissions"
                description="Allows this manager to configure permissions for co-managers in their dept"
                checked={managerPerms.canManageCoManagerPermissions}
                onCheckedChange={(v) =>
                  setManagerPerms((p) => ({ ...p, canManageCoManagerPermissions: v }))
                }
              />
            </div>
          )}

          {/* ── CO_MANAGER ───────────────────────────────────────────────── */}
          {role === "CO_MANAGER" && (
            <div className="divide-y divide-border">
              <p className="text-xs text-muted-foreground pb-3">
                Applies to their assigned departments only.
                Task and progress oversight is always on.
                NONE = no access, VIEW = read-only, MANAGE = full CRUD.
              </p>
              <AccessSelect
                label="Revenue access"
                value={coManagerPerms.revenue}
                onChange={(v) => setCoManagerPerms((p) => ({ ...p, revenue: v }))}
              />
              <AccessSelect
                label="Expenses access"
                value={coManagerPerms.expenses}
                onChange={(v) => setCoManagerPerms((p) => ({ ...p, expenses: v }))}
              />
              <AccessSelect
                label="Reports & docs access"
                value={coManagerPerms.reports}
                onChange={(v) => setCoManagerPerms((p) => ({ ...p, reports: v }))}
              />
            </div>
          )}

          {/* ── unsupported role ─────────────────────────────────────────── */}
          {role !== "CO_ADMIN" && role !== "MANAGER" && role !== "CO_MANAGER" && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Permissions for this role are not configurable.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {["CO_ADMIN", "MANAGER", "CO_MANAGER"].includes(role) && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}