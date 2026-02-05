"use client";

import { useState } from "react";
import { useFinancialStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Users, DollarSign, Box } from "lucide-react";
import type { TeamMember } from "@/lib/types";

const teams = ["Leadership", "Engineering", "Design", "Marketing", "Operations"];
const roles = [
  "CEO",
  "CTO",
  "CFO",
  "Senior Developer",
  "Junior Developer",
  "Product Designer",
  "UI/UX Designer",
  "Marketing Lead",
  "Marketing Manager",
  "Operations Manager",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

export function TeamSection() {
  const { teamMembers, addTeamMember, updateTeamMember, removeTeamMember } =
    useFinancialStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
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
  const roleSummary = roles.reduce(
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
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Edit Team Member" : "Add Team Member"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team / Department</Label>
                <Select
                  value={formData.team}
                  onValueChange={(v) => setFormData({ ...formData, team: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Monthly Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="Enter monthly cost"
                  value={formData.monthlyCost}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyCost: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingMember ? "Update" : "Add"} Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                {formatCurrency(totalMonthlyCost)}
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
                      {formatCurrency(member.monthlyCost)}
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
                      {formatCurrency(item.cost)}
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
                    {formatCurrency(item.cost)}
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
