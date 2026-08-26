"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History } from "lucide-react";

interface HistoryEntry {
  serial: number;
  id: string;
  previousDueDate: string | null;
  newDueDate: string;
  reason: string;
  extendedByName: string;
  createdAt: string;
}

interface MilestoneHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  milestoneId: string;
  milestoneTitle: string;
}

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function MilestoneHistoryDialog({
  open,
  onOpenChange,
  planId,
  milestoneId,
  milestoneTitle,
}: MilestoneHistoryDialogProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const res = await authClient.request(`/api/plan/${planId}/milestones/${milestoneId}/history`);
        setHistory(res.data.data.history);
      } catch (err) {
        console.error("Failed to fetch milestone history:", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, planId, milestoneId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Deadline history — {milestoneTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              This milestone's deadline has never been extended.
            </p>
          ) : (
            <div className="relative pl-6 space-y-5">
              {/* vertical connector line */}
              <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />

              {history.map((entry) => (
                <div key={entry.id} className="relative">
                  <div className="absolute -left-6 top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                    {entry.serial}
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-muted-foreground line-through">{fmt(entry.previousDueDate)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-foreground">{fmt(entry.newDueDate)}</span>
                    </div>
                    <p className="text-xs text-foreground">{entry.reason}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {entry.extendedByName} · {new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}