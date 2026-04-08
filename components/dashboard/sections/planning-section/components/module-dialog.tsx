"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Module } from "@/lib/types";

export function ModuleDialog({
  open,
  editingModule,
  onClose,
  onSave,
}: {
  open: boolean;
  editingModule?: Module | null;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(editingModule?.name ?? "");
  }, [open, editingModule]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-80 rounded-xl border bg-card p-5 shadow-xl space-y-4">
        <h3 className="font-semibold">
          {editingModule ? "Rename Module" : "New Module"}
        </h3>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSave(name.trim());
            if (e.key === "Escape") onClose();
          }}
          placeholder="Module name"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="cursor-pointer" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!name.trim()}
            onClick={() => onSave(name.trim())}
            className="cursor-pointer hover:bg-green-800"
          >
            {editingModule ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}