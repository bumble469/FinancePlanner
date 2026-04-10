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
import { Plus, Pencil, Trash2, Users, DollarSign, Box } from "lucide-react";
import type { TeamMember, Role } from "@/lib/types";
import { ROLES } from "@/lib/types";
import { getCurrencySymbol } from "@/lib/currency";
import { AddMemberDialog } from "./components/member-dialog";
import { authClient } from "@/lib/auth-client";

function formatCurrency(value: number | undefined, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${(value ?? 0).toLocaleString("en-IN")}`;
}

type FormData = {
  id: string;
  name: string;
  email: string;
  role: Role | "";
  departmentIds: string[];
  monthlyCost: string;
};

const defaultFormData: FormData = {
  id: "",
  name: "",
  email: "",
  role: "",
  departmentIds: [],
  monthlyCost: "",
};

export function TeamSection({ planId }: { planId: string }) {  // Fix 3: planId as prop
  const { teamMembers, removeTeamMember, currency, departments } = useFinancialStore();

  console.log("team members: ", teamMembers);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const totalMonthlyCost = teamMembers.reduce((sum, m) => sum + m.monthlyCost, 0);

  const deptSummary = departments.map((d) => {
    const members = teamMembers.filter((m) =>
      (m as any).departmentMembers?.some(
        (dm: any) => dm.departmentId === d.id
      )
    );

    const cost = members.reduce((sum, m) => sum + (m.monthlyCost || 0), 0);

    return {
      id: d.id,
      name: d.name,
      count: members.length,
      cost,
    };
  });

  // Group by role for summary
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

  // Fix 5: resetForm defined as a function
  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const handleSubmit = async (data: {
    id: string;
    name: string;
    role: string;
    departmentIds: string[];
    monthlyCost?: number;
  }) => {
    try {
      await authClient.request(`/api/plan/${planId}/members`, {
        method: "POST",
        data: {
          userId: data.id,
          role: data.role,
          departmentIds: data.departmentIds,
          monthlyCost: data.monthlyCost,
        },
      });

      setIsAddOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to add member");
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);

    setFormData({
      id: member.userId,
      email: member.user?.email || "",
      name: member.user?.name || "",
      role: member.role,
      departmentIds: member.departmentMembers?.map(
        (dm: any) => dm.departmentId
      ) ?? [],
      monthlyCost: member.monthlyCost?.toString() || "",
    });
    setIsAddOpen(true);
  };

  const handleClose = () => {
    setIsAddOpen(false);
    setEditingMember(null);
    // Fix 7: id is included in defaultFormData, so reset is valid
    resetForm();
  };

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
          <Button className="cursor-pointer" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>

          <AddMemberDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            onSubmit={handleSubmit}
          />
        </div>
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Team Table */}
        <div className="lg:col-span-2">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">Role</TableHead>
                  <TableHead className="min-w-[220px]">Departments</TableHead>
                  <TableHead className="text-right min-w-[140px]">
                    Monthly Cost
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    {/* Name */}
                    <TableCell className="font-medium whitespace-nowrap">
                      {member?.user?.name || "-"}
                    </TableCell>

                    {/* Role */}
                    <TableCell className="whitespace-nowrap">
                      {member.role}
                    </TableCell>

                    {/* Departments → CHIPS */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {member?.departmentMembers?.length ? (
                          member.departmentMembers.map((dm) => (
                            <span
                              key={dm.department.id}
                              className="rounded-full bg-secondary px-2 py-1 text-xs whitespace-nowrap"
                            >
                              {dm.department?.name || "—"}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Cost */}
                    <TableCell className="text-right font-mono whitespace-nowrap">
                      {formatCurrency(member.monthlyCost || 0, currency)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTeamMember(member.id)}
                          className="text-danger hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summaries */}
        <div className="space-y-4">
          {/* Cost by Dept */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Cost by Team</h3>
            <div className="mt-4 space-y-3">
              {deptSummary.filter((t) => t.count > 0).map((item) => (
                <div key={item.id} className="flex items-center justify-between">  {/* Fix 8 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{item.name}</span>  {/* Fix 9 */}
                    <span className="text-xs text-muted-foreground">({item.count})</span>
                  </div>
                  <span className="font-mono text-sm text-success">
                    {formatCurrency(item.cost, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost by Role */}
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