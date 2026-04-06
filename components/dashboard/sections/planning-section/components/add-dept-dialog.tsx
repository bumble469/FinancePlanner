"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Dept = {
  id: string;
  name: string;
  budget: number;
};

type Props = {
  onCreate: (id: string, name: string, budget: number) => Promise<void> | void;
  onUpdate?: (id: string, name: string, budget: number) => Promise<void> | void;
  onDeptCreated: () => void;
  maxBudget: number;
  editingDept?: Dept | null;
  open?: boolean;
  setOpen?: (v: boolean) => void;
};

export function AddDeptDialog({
  onCreate,
  onUpdate,
  onDeptCreated,
  maxBudget,
  editingDept,
  open: controlledOpen,
  setOpen: setControlledOpen,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const [name, setName] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!editingDept;
  const numericBudget = Number(budget);

  useEffect(() => {
    if (editingDept) {
      setName(editingDept.name);
      setBudget(String(editingDept.budget));
      setOpen(true);
    } else {
      setName("");
      setBudget("");
    }
  }, [editingDept]);

  const isInvalid =
    !name ||
    !budget ||
    numericBudget <= 0 ||
    (maxBudget >= 0 && numericBudget > maxBudget);

  const handleSubmit = async () => {
    if (isInvalid) return;

    setLoading(true);

    try {
      if (isEdit && editingDept && onUpdate) {
        await onUpdate(editingDept.id, name, numericBudget);
      } else {
        const id = crypto.randomUUID();
        await onCreate(id, name, numericBudget);
      }

      onDeptCreated();

      // reset
      setName("");
      setBudget("");
      setOpen(false);
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button
            size="sm"
            onClick={() => {
              if (setControlledOpen) {
                setControlledOpen(true);
              }
            }}
          >
            + Add
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="space-y-6">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Department" : "Create Department"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* NAME */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marketing, Tech..."
              autoFocus
            />
          </div>

          {/* BUDGET */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Budget
            </Label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Enter amount"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />

            {budget && maxBudget >= 0 && numericBudget > maxBudget && (
              <p className="text-sm text-red-500">
                Budget cannot exceed remaining ({maxBudget})
              </p>
            )}
          </div>
        </div>

        <Button
          className="w-full mt-2"
          onClick={handleSubmit}
          disabled={isInvalid || loading}
        >
          {loading
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
            ? "Save Changes"
            : "Create"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}