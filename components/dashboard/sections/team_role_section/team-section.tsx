"use client";

import { useState } from "react";
import { useFinancialStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Users, DollarSign, Box, RefreshCw } from "lucide-react";
import type { TeamMember } from "@/lib/types";
import { ROLES } from "@/lib/types";
import { getCurrencySymbol } from "@/lib/currency";
import { AddEditMemberDialog } from "./components/member-dialog";
import { authClient } from "@/lib/auth-client";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useSnackbar } from '@/lib/useSnackbar';
import type { PlanPermissions } from "@/lib/permissions";
import { PermissionsDialog } from "./components/permissions-dialog";
import { canEditPermissionsOf, type CoAdminPermissions, type ManagerPermissions } from "@/lib/permissions";
import { Shield } from "lucide-react";

function formatCurrency(value: number | undefined, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${(value ?? 0).toLocaleString("en-IN")}`;
}

export function TeamSection({ planId, permissions }: { planId: string; permissions: PlanPermissions }) {
  const {
    teamMembers,
    removeTeamMember,
    currency,
    departments,
    currentUser,
    setTeamMembers,
    currentPlanMeta
  } = useFinancialStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const { show } = useSnackbar();
  const [permissionsMember, setPermissionsMember] = useState<TeamMember | null>(null);

  const totalMonthlyCost = teamMembers.reduce((sum, m) => sum + m.monthlyCost, 0);

  const deptSummary = departments.map((d) => {
    const members = teamMembers.filter((m) =>
      (m as any).departmentMembers?.some((dm: any) => dm.departmentId === d.id)
    );
    const cost = members.reduce((sum, m) => sum + (m.monthlyCost || 0), 0);
    return { id: d.id, name: d.name, count: members.length, cost };
  });

  const roleSummary = ROLES.reduce(
    (acc, role) => {
      const members = teamMembers.filter((m) => m.role === role);
      if (members.length > 0) {
        acc.push({
          role,
          count: members.length,
          cost: members.reduce((sum, m) => sum + m.monthlyCost, 0),
        });
      }
      return acc;
    },
    [] as { role: string; count: number; cost: number }[]
  );

  const fetchTeamData = async () => {
    try {
      const res = await authClient.request(`/api/plan/${planId}/members`, { method: "GET" });
      setTeamMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (data: {
    id: string;
    name: string;
    role: string;
    departmentIds: string[];
    monthlyCost?: number;
  }) => {
    try {
      if (!editingMember) {
        await authClient.request(`/api/plan/${planId}/members/invitation`, {
          method: "POST",
          data: { invitedUserId: data.id },
        });
        show("User Invited", "success");
      } else {
        await authClient.request(`/api/plan/${planId}/members/${editingMember.id}`, {
          method: "PATCH",
          data: {
            role: data.role,
            departmentIds: data.departmentIds,
            monthlyCost: data.monthlyCost,
          },
        });
      }
      setIsAddOpen(false);
      setEditingMember(null);
      fetchTeamData();
      show("Member Updated", "success");
    } catch (err: any) {
      console.error(err);
      show(
        err?.response?.data?.error ||
        (editingMember ? "Failed to update member" : "Failed to send invitation"),
        "error"
      );
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsAddOpen(true);
  };

  const confirmMemberDelete = async () => {
    if (!deletingMember) return;
    try {
      await authClient.request(`/api/plan/${planId}/members/${deletingMember.id}`, {
        method: "DELETE",
      });
      removeTeamMember(deletingMember.id);
      setDeletingMember(null);
      fetchTeamData();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to delete member");
    }
  };

  // Only show the Actions column if the viewer can do at least one action
  const canManageAnyPermissions =
    currentPlanMeta?.isOwner ||
    (currentPlanMeta?.role === "ADMIN") ||
    (currentPlanMeta?.role === "CO_ADMIN" &&
      !!(currentPlanMeta?.permissions as CoAdminPermissions | null)?.canManagePermissions) ||
    (currentPlanMeta?.role === "MANAGER" &&
      !!(currentPlanMeta?.permissions as ManagerPermissions | null)?.canManageCoManagerPermissions);

  const showActionsColumn =
    permissions.canEditMember || permissions.canDeleteMember || canManageAnyPermissions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team & Roles</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your team members and their associated costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Invite — ADMIN / CO_ADMIN only */}
          {permissions.canInviteMember && (
            <Button
              className="cursor-pointer"
              onClick={() => {
                setEditingMember(null);
                setIsAddOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}

          {/* Reload — everyone */}
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => {
              fetchTeamData();
              show("Members Reloaded", "success");
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>

          {/* Dialog — only mounted when canInviteMember */}
          {permissions.canInviteMember && (
            <AddEditMemberDialog
              open={isAddOpen}
              planId={planId}
              onOpenChange={(open) => {
                setIsAddOpen(open);
                if (!open) setEditingMember(null);
              }}
              onSubmit={handleSubmit}
              initialData={
                editingMember
                  ? {
                    id: editingMember.userId,
                    email: editingMember.user?.email ?? "",
                    name: editingMember.user?.name ?? "",
                    role: editingMember.role as any,
                    departmentIds:
                      editingMember.departmentMembers?.map(
                        (dm: any) => dm.departmentId
                      ) ?? [],
                    monthlyCost: editingMember.monthlyCost,
                  }
                  : null
              }
            />
          )}

          {/* Delete confirm — ADMIN only */}
          {permissions.canDeleteMember && (
            <ConfirmDeleteDialog
              open={!!deletingMember}
              type="member"
              setOpen={(open) => {
                if (!open) setDeletingMember(null);
              }}
              onConfirm={confirmMemberDelete}
            />
          )}
        </div>
        {permissionsMember && (
            <PermissionsDialog
              open={!!permissionsMember}
              onOpenChange={(open) => { if (!open) setPermissionsMember(null); }}
              member={permissionsMember}
              planId={planId}
              onSaved={(updated) => {
                setTeamMembers(
                  teamMembers.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
                );
                setPermissionsMember(null);
              }}
            />
          )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Monthly Cost</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(totalMonthlyCost, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Box className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">3D Nodes Ready</p>
              <p className="text-2xl font-bold text-warning">{teamMembers.length}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Each member maps to a 3D avatar in the visualization
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Departments</TableHead>
                  <TableHead className="text-right">Monthly Cost</TableHead>
                  {/* Only render Actions column header if the viewer can act */}
                  {showActionsColumn && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>

              <TableBody>
                {teamMembers.map((member) => {
                  const isSelf = member.userId === currentUser?.id;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{member.user?.name || "-"}</span>
                          {isSelf && (
                            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{member.role}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {member.departmentMembers?.length ? (
                            member.departmentMembers.map((dm) => (
                              <span
                                key={dm.department.id}
                                className="rounded-full bg-secondary px-2 py-1 text-xs"
                              >
                                {dm.department?.name || "—"}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono">
                        {formatCurrency(member.monthlyCost || 0, currency)}
                      </TableCell>

                      {/* Actions cell — only rendered when the column exists */}
                      {showActionsColumn && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {permissions.canEditMember && !isSelf && (
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(member)} className="cursor-pointer">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Permissions button — only shown if current viewer can edit this member's permissions */}
                            {!isSelf &&
                              ["CO_ADMIN", "MANAGER", "CO_MANAGER"].includes(member.role) &&
                              (currentPlanMeta?.isOwner ||
                                (currentPlanMeta?.role &&
                                  canEditPermissionsOf(
                                    {
                                      role: currentPlanMeta.role as any,
                                      permissions: currentPlanMeta.permissions as CoAdminPermissions | ManagerPermissions | null,
                                    },
                                    member.role as "CO_ADMIN" | "MANAGER" | "CO_MANAGER"
                                  ))) && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setPermissionsMember(member)}
                                  className="cursor-pointer"
                                  title="Manage permissions"
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              )}

                            {permissions.canDeleteMember && !isSelf && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeletingMember(member)}
                                className="text-danger hover:text-danger cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summaries */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Cost by Team</h3>
            <div className="mt-4 space-y-3">
              {deptSummary
                .filter((t) => t.count > 0)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">({item.count})</span>
                    </div>
                    <span className="font-mono text-sm text-success">
                      {formatCurrency(item.cost, currency)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Cost by Role</h3>
            <div className="mt-4 space-y-3">
              {roleSummary.slice(0, 5).map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{item.role}</span>
                    <span className="text-xs text-muted-foreground">({item.count})</span>
                  </div>
                  <span className="font-mono text-sm text-success">
                    {formatCurrency(item.cost, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}