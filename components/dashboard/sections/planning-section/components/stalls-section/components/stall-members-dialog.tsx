"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, UserPlus } from "lucide-react";
import type { Stall } from "@/lib/types";

interface EligibleMember {
  id: string; // workItemMember id
  role: string;
  user: { id: string; name: string | null; image?: string | null };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  stall: Stall | null;
  onChanged: () => void;
}

export function StallMembersDialog({ open, onOpenChange, planId, stall, onChanged }: Props) {
  const [eligible, setEligible] = useState<EligibleMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEligible = async () => {
    setLoading(true);
    try {
      const res = await authClient.request(`/api/plan/${planId}/members?pageSize=50`);
      setEligible(res.data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) fetchEligible(); }, [open]);

  if (!stall) return null;

  const assignedUserIds = new Set(stall.members.map((m) => m.userId));

  const assignMember = async (workItemMemberId: string) => {
    try {
      await authClient.request(`/api/plan/${planId}/stalls/${stall.id}/members`, {
        method: "POST",
        data: { workItemMemberId },
      });
      onChanged();
    } catch (err) {
      console.error("Assign stall member failed:", err);
    }
  };

  const removeMember = async (stallMemberId: string) => {
    try {
      await authClient.request(`/api/plan/${planId}/stalls/${stall.id}/members/${stallMemberId}`, {
        method: "DELETE",
      });
      onChanged();
    } catch (err) {
      console.error("Remove stall member failed:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Members — {stall.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Assigned</p>
              <div className="space-y-2">
                {stall.members.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No members assigned</p>
                ) : (
                  stall.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span className="text-sm">{m.user.name || "Unnamed"}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeMember(m.id)} className="cursor-pointer">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Add members</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {eligible.filter((m) => !assignedUserIds.has(m.user.id)).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No available members</p>
                ) : (
                  eligible.filter((m) => !assignedUserIds.has(m.user.id)).map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{m.user.name || "Unnamed"}</span>
                        <span className="text-xs text-muted-foreground">{m.role}</span>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => assignMember(m.id)} className="cursor-pointer">
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