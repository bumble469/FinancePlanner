"use client";

import { useState } from "react";
import { ArrowRight, Trash2, Pencil } from "lucide-react";
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
import { authClient } from "@/lib/auth-client";

interface PlanCardProps {
  plan: any;
  onEdit: (plan: Plan) => void;
  variant?: "default" | "invitation" | "collaboration";
  onRefresh?: () => void;
}

export function PlanCard({
  plan,
  onEdit,
  variant = "default",
  onRefresh,
}: PlanCardProps) {
  const { removePlan } = useFinancialStore();
  const [deleting, setDeleting] = useState(false);

  const isInvitation = variant === "invitation";
  const isCollaboration = variant === "collaboration";

  const handleInvitation = async (action: "ACCEPT" | "REJECT") => {
    try {
      await authClient.request(
        `/api/plan/${plan.workItemId}/members/invitation/response`,
        {
          method: "POST",
          data: {
            invitationId: plan.id,
            action,
          },
        }
      );
      onRefresh?.();
    } catch (err) {
      console.error(err);
    }
  };

  if (isInvitation) {
    return (
      <Card className="border border-border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {plan.workItem.name}
          </h3>

          <div className="mt-2 flex gap-2">
            <Badge variant="outline">{plan.workItem.type}</Badge>
            <Badge className="bg-warning text-warning-foreground">
              {plan.status}
            </Badge>
          </div>
        </div>

        {plan.workItem.description && (
          <p className="text-sm text-muted-foreground">
            {plan.workItem.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invited By</span>
            <span>{plan.invitedBy?.name || "Unknown"}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span>{plan.role}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 cursor-pointer"
            onClick={() => handleInvitation("ACCEPT")}
          >
            Accept
          </Button>

          <Button
            variant="outline"
            className="flex-1 cursor-pointer hover:text-gray-600"
            onClick={() => handleInvitation("REJECT")}
          >
            Reject
          </Button>
        </div>
      </Card>
    );
  }

  const spent = plan.expenses.reduce(
    (sum: number, e: any) => sum + e.amount,
    0
  );

  const profitLoss = plan.budget - spent;
  const spentPercent = (spent / plan.budget) * 100;
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
      await authClient.request(`/api/plan/${plan.id}`, { method: "DELETE" });
      removePlan(plan.id);
    } catch (error) {
      console.error("Failed to delete plan", error);
    } finally {
      setDeleting(false);
    }
  };

  if (isCollaboration) {
    return (
      <Card className="border border-border bg-card p-6 transition-all hover:shadow-lg">
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2">
              {plan.name}
            </h3>
            <Badge className={`text-xs shrink-0 ${getStatusColor()}`}>
              {getStatusLabel()}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {plan.type === "project" ? "Project" : "Event"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {plan.role}
            </Badge>
          </div>
        </div>

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

          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                isRisk
                  ? "bg-danger"
                  : isWarning
                  ? "bg-warning"
                  : "bg-success"
              }`}
              style={{ width: `${Math.min(spentPercent, 100)}%` }}
            />
          </div>
        </div>

        <Link href={`/plans/${plan.id}`}>
          <Button className="w-full gap-2 cursor-pointer" size="sm">
            View Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="relative border border-border bg-card p-6 transition-all hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3"
          onClick={() => onEdit(plan)}
        >
          <Pencil className="h-4 w-4" />
        </Button>

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
      </div>

      <div className="flex gap-2">
        <Link href={`/plans/${plan.id}`} className="flex-1">
          <Button className="w-full gap-2 cursor-pointer" size="sm">
            View Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePlan} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}