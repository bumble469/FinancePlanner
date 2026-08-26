"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { HardwareItem } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: HardwareItem | null;
  onReview: (action: "approve" | "decline", reason?: string) => Promise<void>;
}

export function ReviewHardwareDialog({ open, onOpenChange, item, onReview }: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!item) return null;

  const handle = async (action: "approve" | "decline") => {
    if (action === "decline" && !reason.trim()) {
      setError("A reason is required to decline");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onReview(action, action === "decline" ? reason.trim() : undefined);
      setReason("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review request — {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {item.quantity}x {item.category.toLowerCase()} · {item.source.toLowerCase()}
            {item.vendor && ` · ${item.vendor}`}
          </p>

          <div className="space-y-1.5">
            <Label>Reason for declining <span className="text-xs text-muted-foreground font-normal">(only needed if declining)</span></Label>
            <Textarea
              rows={3}
              className="resize-none"
              placeholder="Explain why this request is being declined..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button variant="destructive" onClick={() => handle("decline")} disabled={loading}>
              {loading ? "..." : "Decline"}
            </Button>
            <Button onClick={() => handle("approve")} disabled={loading}>
              {loading ? "..." : "Approve"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}