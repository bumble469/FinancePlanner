"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useFinancialStore } from "@/lib/store";
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

import type { Role, Department } from "@/lib/types";

type AllowedRole = Exclude<Role, "ADMIN">;

const ALL_ROLES: AllowedRole[] = [
  "CO_ADMIN",
  "MANAGER",
  "CO_MANAGER",
  "MEMBER",
];

interface TeamMember {
  id: string;
  name: string;
  role: AllowedRole;
  departmentIds: string[];
  monthlyCost?: number;
}

interface Props {
  open: boolean;
  planId: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeamMember) => void;
  initialData?: {
    id: string;
    name: string;
    email: string;
    role: AllowedRole;
    departmentIds: string[];
    monthlyCost?: number;
  } | null;
}

export function AddEditMemberDialog({
  open,
  planId,
  onOpenChange,
  onSubmit,
  initialData,
}: Props) {
  const { departments } = useFinancialStore();

  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    id: "",
    email: "",
    name: "",
    role: "" as AllowedRole | "",
    departmentIds: [] as string[],
    monthlyCost: "",
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userSelected, setUserSelected] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setFormData({
        id: initialData.id,
        email: initialData.email,
        name: initialData.name,
        role: initialData.role,
        departmentIds: initialData.departmentIds,
        monthlyCost: initialData.monthlyCost?.toString() ?? "",
      });

      setUserSelected(true);
      setUsers([]);
    } else {
      resetForm();
    }
  }, [open, initialData]);

  useEffect(() => {
    if (isEditMode) return;

    if (!formData.email.trim()) {
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
            planId,
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
  }, [formData.email, planId, isEditMode]);

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

  const toggleDepartment = (id: string) => {
    setFormData((prev) => {
      const exists = prev.departmentIds.includes(id);

      return {
        ...prev,
        departmentIds: exists
          ? prev.departmentIds.filter((d) => d !== id)
          : [...prev.departmentIds, id],
      };
    });
  };

  const resetForm = () => {
    setFormData({
      id: "",
      email: "",
      name: "",
      role: "",
      departmentIds: [],
      monthlyCost: "",
    });

    setUsers([]);
    setUserSelected(false);
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.role) return;

    onSubmit({
      id: formData.id,
      name: formData.name,
      role: formData.role as AllowedRole,
      departmentIds: isEditMode ? formData.departmentIds : [],
      monthlyCost: isEditMode
        ? formData.role === "CO_ADMIN" || !formData.monthlyCost
          ? undefined
          : Number(formData.monthlyCost)
        : undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const formatRole = (role: string) =>
    role
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("-");

  const showDepartments =
    isEditMode && formData.role && formData.role !== "CO_ADMIN";

  const showCost =
    isEditMode && formData.role && formData.role !== "CO_ADMIN";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Member" : "Invite Member"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Invite Mode */}
          {!isEditMode && (
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

              {loadingUser && (
                <p className="text-xs text-muted-foreground">
                  Searching...
                </p>
              )}

              {users.length > 0 && !userSelected && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="cursor-pointer px-3 py-2 hover:bg-accent text-sm"
                      onClick={() => handleSelectUser(user)}
                    >
                      {user.email}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({user.name || "No name"})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {userSelected && (
                <>
                  <p className="text-xs text-green-600">
                    Selected: {formData.name}
                  </p>

                  <div className="space-y-2 mt-3">
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(v) =>
                        setFormData((prev) => ({
                          ...prev,
                          role: v as AllowedRole,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {formatRole(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Edit Mode */}
          {isEditMode && (
            <>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: v as AllowedRole,
                      departmentIds: [],
                      monthlyCost: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {formatRole(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showDepartments && (
                <div className="space-y-2">
                  <Label>Departments</Label>

                  <div className="grid grid-cols-2 gap-2">
                    {departments.map((d: Department) => {
                      const selected = formData.departmentIds.includes(d.id);

                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDepartment(d.id)}
                          className={`rounded border p-2 text-sm transition ${
                            selected
                              ? "bg-primary text-white"
                              : "bg-background hover:bg-muted"
                          }`}
                        >
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {showCost && (
                <div className="space-y-2">
                  <Label>Monthly Cost (optional)</Label>
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
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="cursor-pointer hover:text-gray-600"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!userSelected || !formData.role}
              className="cursor-pointer"
            >
              {isEditMode ? "Save Changes" : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}