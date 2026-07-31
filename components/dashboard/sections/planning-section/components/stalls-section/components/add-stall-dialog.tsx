"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Stall } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Stall | null;
  onSave: (data: { name: string; description?: string }) => Promise<void>;
}

export function AddStallDialog({ open, onOpenChange, editing, onSave }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setError("");
    }
  }, [open, editing]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Stall name is required");
      return;
    }
    setLoading(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined });
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
          <DialogTitle>{editing ? "Edit stall" : "Add stall"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              autoFocus
              placeholder="e.g. Food Stall — North Wing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              placeholder="Any notes about this stall"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editing ? "Save changes" : "Add stall"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}