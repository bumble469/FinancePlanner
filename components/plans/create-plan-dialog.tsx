"use client";

import React from "react"

import { useState } from "react";
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
import { useFinancialStore } from "@/lib/store";
import type { PlanType } from "@/lib/types";

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * CreatePlanDialog - Form to create a new plan
 * 
 * Flow:
 * 1. User enters plan name, type (project/event), and budget
 * 2. Store creates new Plan with empty arrays for team/expenses
 * 3. User can then open dashboard to add details
 */

export function CreatePlanDialog({ open, onOpenChange }: CreatePlanDialogProps) {
  const { addPlan } = useFinancialStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<PlanType>("project");
  const [budget, setBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !budget.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const budgetAmount = Number.parseFloat(budget);
      if (budgetAmount > 0) {
        addPlan(name, type, budgetAmount);
        setName("");
        setBudget("");
        setType("project");
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogDescription>
            Set up a new project or event to track finances
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="plan-name" className="text-sm font-medium">
              Plan Name
            </Label>
            <Input
              id="plan-name"
              placeholder="e.g., Q2 Marketing, Summer Event"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Plan Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Plan Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as PlanType)}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="project" id="type-project" />
                <Label htmlFor="type-project" className="font-normal cursor-pointer">
                  <span className="font-medium">Project</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    For business operations
                  </span>
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="event" id="type-event" />
                <Label htmlFor="type-event" className="font-normal cursor-pointer">
                  <span className="font-medium">Event</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    For event planning with ticket revenue
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="plan-budget" className="text-sm font-medium">
              Budget ($)
            </Label>
            <Input
              id="plan-budget"
              type="number"
              placeholder="e.g., 50000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={isLoading}
              min="1"
              step="0.01"
            />
          </div>

          {/* Actions */}
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
              {isLoading ? "Creating..." : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
