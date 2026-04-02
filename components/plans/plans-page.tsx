"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFinancialStore } from "@/lib/store";
import { PlanCard } from "./plan-card";
import { CreatePlanDialog } from "./create-plan-dialog";
import type { Plan } from "@/lib/types";
import axios from "axios";

function mapWorkItemToPlan(workItem: any): Plan {
  return {
    id: workItem.id,
    accountId: workItem.accountId,
    name: workItem.name,
    type: workItem.type.toLowerCase() as Plan["type"],
    status: workItem.status.toLowerCase() as Plan["status"],
    budget: Number(workItem.budget ?? 0),
    spent: 0,
    currency: workItem.currency ?? "USD",
    description: workItem.description ?? undefined,
    createdAt: new Date(workItem.createdAt),
    teamMembers: [],
    expenses: [],
    eventData: undefined,
    simulation: {
      costMultiplier: 1,
      additionalMembers: 0,
      revenueAdjustment: 0,
      isSimulating: false,
    },
    mode: workItem.type === "EVENT" ? "event" : "company",
  };
}

export function PlansPage() {
  const { plans, account, setPlans, setIsLoading, setError, isLoading, error } =
    useFinancialStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await axios.get("/api/plan", { withCredentials: true });
        setPlans(data.data.map(mapWorkItemToPlan));
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error || "Failed to fetch plans");
        } else {
          setError("Something went wrong");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const activePlans = plans.filter((p) => p.status === "active");
  const completedPlans = plans.filter((p) => p.status === "completed");

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

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
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
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
            <h2 className="text-2xl font-semibold text-foreground">
              Completed Plans
            </h2>
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

      <CreatePlanDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}