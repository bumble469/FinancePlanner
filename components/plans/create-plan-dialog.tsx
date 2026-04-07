"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plan } from "@/lib/types";
import { useFinancialStore } from "@/lib/store";
import type { PlanType } from "@/lib/types";
import { authClient } from "@/lib/auth-client";

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanCreate: () => void;
  initialData?: Plan;
  isEditMode?: boolean;
}

export function CreatePlanDialog({
  open,
  onOpenChange,
  onPlanCreate,
  initialData,
  isEditMode = false,
}: CreatePlanDialogProps) {
  const { addPlan } = useFinancialStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<PlanType>("project");
  const [budget, setBudget] = useState("");

  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ PREFILL WHEN EDITING
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setBudget(String(initialData.budget));
      setDescription(initialData.description || "");
      setCurrency(initialData.currency);
      setIsActive(initialData.status === "active");
    } else {
      // reset when switching back to create mode
      setName("");
      setType("project");
      setBudget("");
      setDescription("");
      setCurrency("USD");
      setIsActive(true);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const budgetAmount = parseFloat(budget);
    if (!name.trim() || !budget.trim() || budgetAmount <= 0) return;

    setIsLoading(true);

    try {
      const url = isEditMode ? `/api/plan/${initialData?.id}` : "/api/plan";
      const method = isEditMode ? "PATCH" : "POST";
      const { data } = await authClient.request(url, {
        method,
        data: {
          name: name.trim(),
          type: type.toUpperCase(),
          budget: budgetAmount,
          description: description.trim(),
          currency,
          status: isActive ? "ACTIVE" : "INACTIVE",
        },
      });

      // only add on create
      if (!isEditMode) {
        addPlan(data.data);
      }

      onPlanCreate();
      onOpenChange(false);
    } catch (err) {
      setError(
        `Failed to ${isEditMode ? "update" : "create"} plan: ${
          (err as Error).message
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Plan" : "Create New Plan"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your plan details"
              : "Set up a new project or event to track finances"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* PLAN NAME */}
          <div className="space-y-2">
            <Label>Plan Name</Label>
            <Input
              placeholder="e.g., Q2 Marketing, Summer Event"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* PLAN TYPE */}
          <div className="space-y-3">
            <Label>Plan Type</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as PlanType)}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="project" id="project" />
                <Label htmlFor="project">Project</Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="event" id="event" />
                <Label htmlFor="event">Event</Label>
              </div>
            </RadioGroup>
          </div>

          {/* BUDGET */}
          <div className="space-y-2">
            <Label>Budget</Label>
            <Input
              type="number"
              placeholder="50000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={isLoading}
              min="1"
            />
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Optional: Add details about this plan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* CURRENCY */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* STATUS */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Status</Label>
              <p className="text-xs text-muted-foreground">
                {isActive ? "Active plan" : "Inactive plan"}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isLoading}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !budget.trim()}
              className="flex-1"
            >
              {isLoading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Plan"
                : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}