"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, UserPlus } from "lucide-react";

type Member = {
  id: string;
  workItemMember: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      image?: string | null;
    };
  };
};

type EligibleMember = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    image?: string | null;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workItemId: string;
  deptId: string;
  phaseId: string;
  taskId: string;
};

export function TaskMembersDialog({
  open,
  onOpenChange,
  workItemId,
  deptId,
  phaseId,
  taskId,
}: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [eligible, setEligible] = useState<EligibleMember[]>([]);
  const [loading, setLoading] = useState(false);

  const baseUrl = `/api/plan/${workItemId}/departments/${deptId}/phases/${phaseId}/tasks/${taskId}`;

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await authClient.request(`${baseUrl}/members`, {
        method: "GET",
      });

      console.log("task members response:", res.data);

      setMembers(res.data?.assigned ?? []);
      setEligible(res.data?.eligible ?? []);
    } catch (err) {
      console.error("Failed to fetch task members:", err);
      setMembers([]);
      setEligible([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const assignMember = async (workItemMemberId: string) => {
    try {
      await authClient.request(`${baseUrl}/members`, {
        method: "POST",
        data: { workItemMemberId },
      });

      await fetchData();
    } catch (err) {
      console.error("Assign member failed:", err);
    }
  };

  const removeMember = async (workItemMemberId: string) => {
    try {
      await authClient.request(
        `${baseUrl}/members?workItemMemberId=${workItemMemberId}`,
        {
          method: "DELETE",
        }
      );

      await fetchData();
    } catch (err) {
      console.error("Remove member failed:", err);
    }
  };

  const assignedIds = new Set(
    (members ?? []).map((m) => m.workItemMember.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Task Members</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-4">
            {/* Assigned members */}
            <div>
              <p className="text-sm font-medium mb-2">Assigned Members</p>

              <div className="space-y-2">
                {members.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No members assigned
                  </p>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {member.workItemMember.user.name || "Unnamed"}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {member.workItemMember.role}
                        </span>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          removeMember(member.workItemMember.id)
                        }
                        className="cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Eligible members */}
            <div>
              <p className="text-sm font-medium mb-2">Add Members</p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {eligible.filter((m) => !assignedIds.has(m.id)).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No available members
                  </p>
                ) : (
                  eligible
                    .filter((m) => !assignedIds.has(m.id))
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {member.user.name || "Unnamed"}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {member.role}
                          </span>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => assignMember(member.id)}
                          className="cursor-pointer"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}