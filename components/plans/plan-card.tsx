"use client";

import { useState } from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFinancialStore } from "@/lib/store";
import type { Plan } from "@/lib/types";
import axios from "axios";

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  const { removePlan } = useFinancialStore();
  const [deleting, setDeleting] = useState(false);

  const spent = plan.expenses.reduce((sum, e) => sum + e.spentAmount, 0);
  const profitLoss = plan.budget - spent;
  const spentPercent = (spent / plan.budget) * 100;
  const isEvent = plan.type === "event";
  const isWarning = spentPercent > 75;
  const isRisk = spentPercent > 90;

  const getStatusColor = () => {
    if (plan.status === "completed") return "bg-muted text-muted-foreground";
    if (isRisk) return "bg-danger text-danger-foreground";
    if (isWarning) return "bg-warning text-warning-foreground";
    return "bg-success text-success-foreground";
  };

  const getStatusLabel = () => {
    if (plan.status === "completed") return "Completed";
    if (isRisk) return "At Risk";
    if (isWarning) return "Warning";
    return "Healthy";
  };

  const handleDeletePlan = async () => {
    try {
      setDeleting(true);

      await axios.delete(`/api/plan/${plan.id}`, {
        withCredentials: true,
      });

      removePlan(plan.id);
    } catch (error) {
      console.error("Failed to delete plan", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="relative border border-border bg-card p-6 transition-all hover:shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground line-clamp-2">
            {plan.name}
          </h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {plan.type === "project" ? "Project" : "Event"}
            </Badge>
            <Badge className={`text-xs ${getStatusColor()}`}>
              {getStatusLabel()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-semibold text-foreground">
            ${plan.budget.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span className="font-semibold text-foreground">
            ${spent.toLocaleString()} ({spentPercent.toFixed(1)}%)
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all ${
              isRisk
                ? "bg-danger"
                : isWarning
                ? "bg-warning"
                : "bg-success"
            }`}
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {profitLoss >= 0 ? "Remaining" : "Over Budget"}
          </span>
          <span
            className={`font-semibold ${
              profitLoss >= 0 ? "text-success" : "text-danger"
            }`}
          >
            ${Math.abs(profitLoss).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Event Info */}
      {isEvent && plan.eventData && (
        <div className="mb-6 space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Attendance</span>
            <span className="font-semibold text-foreground">
              {plan.eventData.estimatedAttendance.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-semibold text-foreground">
              ${plan.eventData.expectedRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex gap-2">
        <Link href={`/plans/${plan.id}`} className="flex-1">
          <Button className="w-full gap-2" size="sm">
            View Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        {/* ✅ THEMED DELETE DIALOG */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete Plan?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                plan and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePlan}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}