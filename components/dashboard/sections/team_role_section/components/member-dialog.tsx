"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Role } from "@/lib/types";

const ALL_ROLES: Role[] = [
  "ADMIN",
  "CO_ADMIN",
  "MANAGER",
  "CO_MANAGER",
  "MEMBER",
];

const TEAMS = [
  "Leadership",
  "Engineering",
  "Design",
  "Marketing",
  "Operations",
];

interface TeamMember {
  id: string;
  name: string;
  role: Role;
  team: string;
  monthlyCost: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeamMember) => void;
}

export function AddMemberDialog({ open, onOpenChange, onSubmit }: Props) {
  const [formData, setFormData] = useState({
    id: "",
    email: "",
    name: "",
    role: "" as Role | "",
    team: "",
    monthlyCost: "",
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userSelected, setUserSelected] = useState(false);

  // 🔥 SEARCH USERS AS YOU TYPE
  useEffect(() => {
    if (!formData.email) {
      setUsers([]);
      setUserSelected(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingUser(true);

        const res = await authClient.request("/api/users/by-email", {
          method: "GET",
          params: {
            email: formData.email,
          },
        });

        setUsers(res.data || []);
      } catch {
        setUsers([]);
      } finally {
        setLoadingUser(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [formData.email]);

  // 🔥 SELECT USER FROM LIST
  const handleSelectUser = (user: any) => {
    setFormData((prev) => ({
      ...prev,
      id: user.id,
      name: user.name || "",
      email: user.email,
    }));

    setUsers([]);
    setUserSelected(true);
  };

  const resetForm = () => {
    setFormData({
      id: "",
      email: "",
      name: "",
      role: "",
      team: "",
      monthlyCost: "",
    });
    setUsers([]);
    setUserSelected(false);
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.role || !formData.team) return;

    onSubmit({
      id: formData.id,
      name: formData.name,
      role: formData.role as Role,
      team: formData.team,
      monthlyCost: Number(formData.monthlyCost || 0),
    });

    resetForm();
    onOpenChange(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* EMAIL SEARCH INPUT */}
          <div className="space-y-2 relative">
            <Label>Email</Label>
            <Input
              placeholder="Search user by email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />

            {/* LOADING */}
            {loadingUser && (
              <p className="text-xs text-muted-foreground">
                Searching...
              </p>
            )}

            {/* DROPDOWN RESULTS */}
            {/* DROPDOWN RESULTS */}
            {users.length > 0 && !userSelected && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm text-popover-foreground"
                    onClick={() => handleSelectUser(user)}
                  >
                    {user.email}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({user.name || "No name"})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AFTER USER SELECTED */}
          {userSelected && (
            <>
              <p className="text-xs text-green-600">
                Selected: {formData.name}
              </p>

              {/* ROLE */}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: v as Role,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* TEAM */}
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.team}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      team: v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* COST */}
              <div className="space-y-2">
                <Label>Monthly Cost</Label>
                <Input
                  type="number"
                  placeholder="Enter monthly cost"
                  value={formData.monthlyCost}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthlyCost: e.target.value,
                    }))
                  }
                />
              </div>
            </>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!userSelected}>
              Add Member
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}