"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFinancialStore } from "@/lib/store";
import { PlanCard } from "./plan-card";
import { CreatePlanDialog } from "./create-plan-dialog";
import type { Plan } from "@/lib/types";

/**
 * PlansPage - Display and manage all plans for the current account
 * 
 * Data Flow:
 * Account (useFinancialStore)
 *   └── Plans (array of Plan objects)
 *       ├── Plan metrics (budget, spent, profit/loss, status)
 *       └── Links to /plans/[planId]/dashboard
 */

export function PlansPage() {
  const { plans, account } = useFinancialStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const activePlans = plans.filter((p) => p.status === "active");
  const completedPlans = plans.filter((p) => p.status === "completed");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Plans</h1>
        <p className="text-muted-foreground">
          Manage financial plans for {account?.name}
        </p>
      </div>

      {/* Create Plan Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Active Plans Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-foreground">Active Plans</h2>
          <Badge variant="secondary" className="text-xs">
            {activePlans.length}
          </Badge>
        </div>

        {activePlans.length === 0 ? (
          <Card className="border border-border bg-card/50 p-8 text-center">
            <p className="text-muted-foreground">No active plans yet.</p>
            <Button
              variant="outline"
              className="mt-4 bg-transparent"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create your first plan
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Plans Section */}
      {completedPlans.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">Completed Plans</h2>
            <Badge variant="secondary" className="text-xs">
              {completedPlans.length}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}

      {/* Create Plan Dialog */}
      <CreatePlanDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
