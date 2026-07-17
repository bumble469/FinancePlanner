"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClockArrowUp } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useSnackbar } from "@/lib/useSnackbar";

interface Props {
  planId: string;
  targetType: "TASK" | "MILESTONE";
  targetId: string;
  itemLabel: string;
  currentDueDate?: string;
  /** Upper bound for the requested date (e.g. the milestone's due date for a task). */
  maxDate?: string;
  trigger?: React.ReactNode;
}

export function RequestExtensionDialog({
  planId,
  targetType,
  targetId,
  itemLabel,
  currentDueDate,
  maxDate,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [requestedDueDate, setRequestedDueDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useSnackbar();

  // en-CA locale gives YYYY-MM-DD which matches <input type="date"> value format
  const todayStr = new Date().toLocaleDateString("en-CA");
  const maxDateStr = maxDate ? maxDate.split("T")[0] : undefined;

  // The extension must be AFTER the current due date — compute the day after it
  const currentDueDateStr = currentDueDate ? currentDueDate.split("T")[0] : undefined;
  const minDateStr = currentDueDateStr
    ? (() => {
        const d = new Date(currentDueDateStr);
        d.setDate(d.getDate() + 1);
        return d.toLocaleDateString("en-CA");
      })()
    : todayStr;

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setRequestedDueDate("");
      setReason("");
      setError(null);
    }
  }

  async function handleSubmit() {
    if (!requestedDueDate) return setError("A requested date is required");

    if (currentDueDateStr && requestedDueDate <= currentDueDateStr) {
      return setError(
        `The extension date must be after the current due date (${new Date(currentDueDateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})`
      );
    }

    if (requestedDueDate < todayStr) {
      return setError("The requested date cannot be in the past");
    }

    if (maxDateStr && requestedDueDate > maxDateStr) {
      return setError(
        `Date cannot exceed the milestone deadline (${new Date(maxDateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})`
      );
    }

    if (!reason.trim()) return setError("Please explain why you need the extension");

    setSubmitting(true);
    setError(null);
    try {
      await authClient.request(`/api/plan/${planId}/extension-requests`, {
        method: "POST",
        data: {
          targetType,
          taskId: targetType === "TASK" ? targetId : undefined,
          milestoneId: targetType === "MILESTONE" ? targetId : undefined,
          requestedDueDate,
          reason: reason.trim(),
        },
      });
      show("Extension request submitted", "success");
      handleOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="icon" variant="ghost" className="h-7 w-7 cursor-pointer" title="Request extension">
            <ClockArrowUp className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request extension</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Requesting an extension for{" "}
            <span className="font-medium text-foreground">"{itemLabel}"</span>.
            {currentDueDate && (
              <>
                {" "}Current due date:{" "}
                <span className="font-medium text-foreground">
                  {new Date(currentDueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>.
              </>
            )}
          </p>

          <div className="space-y-1.5">
            <Label>Requested due date</Label>
            <Input
              type="date"
              value={requestedDueDate}
              min={minDateStr}
              max={maxDateStr}
              onChange={(e) => setRequestedDueDate(e.target.value)}
            />
            {maxDateStr && (
              <p className="text-xs text-muted-foreground">
                Must be on or before the milestone deadline:{" "}
                <span className="font-medium">
                  {new Date(maxDateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea
              placeholder="Why do you need more time?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting} className="cursor-pointer hover:text-gray-600">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="cursor-pointer">
            {submitting ? "Submitting..." : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}