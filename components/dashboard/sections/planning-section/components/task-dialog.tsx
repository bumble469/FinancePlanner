// components/task-dialog.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Task } from "@/lib/types";

export function TaskDialog({
  open,
  editingTask,
  onClose, 
  onSave,
}: {
  open: boolean;
  editingTask?: Task | null;
  onClose: () => void;
  onSave: (data: { title: string; description?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(editingTask?.title ?? "");
      setDescription(editingTask?.description ?? "");
    }
  }, [open, editingTask]);

  if (!open) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-xl border bg-card p-5 shadow-xl space-y-4">
        <h3 className="font-semibold">
          {editingTask ? "Edit Task" : "New Task"}
        </h3>

        <div className="space-y-2">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") onClose();
            }}
            placeholder="Task title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
            placeholder="Add a description..."
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" className="cursor-pointer" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!title.trim()} onClick={handleSave} className="cursor-pointer">
            {editingTask ? "Save changes" : "Add task"}
          </Button>
        </div>
      </div>
    </div>
  );
}