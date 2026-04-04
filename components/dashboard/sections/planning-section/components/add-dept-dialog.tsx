"use client";

import { useState } from "react";
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

type Props = {
  onCreate: (id: string, name: string, budget: number) => Promise<void> | void;
  onDeptCreated: () => void;
  maxBudget: number;
};

export function AddDeptDialog({
  onCreate,
  onDeptCreated,
  maxBudget,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const numericBudget = Number(budget);

  const isInvalid =
    !name ||
    !budget ||
    numericBudget <= 0 ||
    numericBudget > maxBudget;

  const handleCreate = async () => {
    if (isInvalid) return;

    setLoading(true);

    try {
      const id = crypto.randomUUID();

      await onCreate(id, name, numericBudget);
      onDeptCreated();

      // reset
      setName("");
      setBudget("");
      setOpen(false);
    } catch (err) {
      console.error("Create failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add</Button>
      </DialogTrigger>

      <DialogContent className="space-y-6">
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
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
                if (e.key === "Enter") handleCreate();
              }}
            />

            {budget && numericBudget > maxBudget && (
              <p className="text-sm text-red-500">
                Budget cannot exceed plan limit (${maxBudget})
              </p>
            )}
          </div>
        </div>

        <Button
          className="w-full mt-2"
          onClick={handleCreate}
          disabled={isInvalid || loading}
        >
          {loading ? "Creating..." : "Create"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}