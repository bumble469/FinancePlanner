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
const teams = ["Leadership", "Engineering", "Design", "Marketing", "Operations"];

function formatCurrency(value: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${value.toLocaleString("en-IN")}`;
}

export function TeamSection() {
  const { teamMembers, addTeamMember, updateTeamMember, removeTeamMember, currency } =
    useFinancialStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    role: Role | "";
    team: string;
    monthlyCost: string;
  }>({
    name: "",
    role: "",
    team: "",
    monthlyCost: "",
  });

  const totalMonthlyCost = teamMembers.reduce((sum, m) => sum + m.monthlyCost, 0);

  // Group by team for summary
  const teamSummary = teams.map((team) => {
    const members = teamMembers.filter((m) => m.team === team);
    const cost = members.reduce((sum, m) => sum + m.monthlyCost, 0);
    return { team, count: members.length, cost };
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

  const handleSubmit = () => {
    if (!formData.name || !formData.role || !formData.team || !formData.monthlyCost)
      return;

    if (editingMember) {
      updateTeamMember(editingMember.id, {
        name: formData.name,
        role: formData.role,
        team: formData.team,
        monthlyCost: Number(formData.monthlyCost),
      });
      setEditingMember(null);
    } else {
      addTeamMember({
        id: crypto.randomUUID(), 
        name: formData.name,
        role: formData.role,
        team: formData.team,
        monthlyCost: Number(formData.monthlyCost),
      });
    }

    setFormData({ name: "", role: "", team: "", monthlyCost: "" });
    setIsAddOpen(false);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      team: member.team,
      monthlyCost: member.monthlyCost.toString(),
    });
    setIsAddOpen(true);
  };

  const handleClose = () => {
    setIsAddOpen(false);
    setEditingMember(null);
    setFormData({ name: "", role: "", team: "", monthlyCost: "" });
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
              <p className="text-2xl font-bold text-foreground">
                {teamMembers.length}
              </p>
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
              <p className="text-2xl font-bold text-warning">
                {teamMembers.length}
              </p>
            </div>
          </div>
          {/* Integration point note */}
          <p className="mt-2 text-xs text-muted-foreground">
            Each member maps to a 3D avatar in the visualization
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Team Table */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Monthly Cost</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                        {member.team}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(member.monthlyCost, currency)}
                    </TableCell>
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
          {/* Cost by Team */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Cost by Team</h3>
            <div className="mt-4 space-y-3">
              {teamSummary
                .filter((t) => t.count > 0)
                .map((item) => (
                  <div key={item.team} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{item.team}</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.count})
                      </span>
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
                    <span className="text-xs text-muted-foreground">
                      ({item.count})
                    </span>
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
