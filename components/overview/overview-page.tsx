"use client";

import { useFinancialStore, calculateMetrics } from "@/lib/store";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * OverviewPage - Global account-level overview
 * 
 * Data Flow:
 * Account (useFinancialStore)
 *   └── All Plans (aggregated)
 *       ├── Total Budget (sum of all plans)
 *       ├── Total Spent (sum of all plans)
 *       ├── Total Profit/Loss (aggregated)
 *       └── Plan summary cards
 */

export function OverviewPage() {
  const { account, plans } = useFinancialStore();

  // Aggregate metrics across all plans
  const totalBudget = plans.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = plans.reduce((sum, p) => {
    return sum + p.expenses.reduce((esum, e) => esum + e.spentAmount, 0);
  }, 0);
  const totalRemaining = totalBudget - totalSpent;
  const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Event-specific totals
  const eventPlans = plans.filter((p) => p.type === "event");
  const totalEventRevenue = eventPlans.reduce(
    (sum, p) => sum + (p.eventData?.expectedRevenue || 0),
    0
  );
  const totalEventExpenses = eventPlans.reduce(
    (sum, p) => sum + (p.eventData?.eventExpenses || 0),
    0
  );

  // Status indicators
  const isWarning = spentPercent > 75;
  const isRisk = spentPercent > 90;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground">
          Global financial summary for {account?.name}
        </p>
      </div>

      {/* High-level Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Budget"
          value={`$${(totalBudget / 1000).toFixed(1)}k`}
          status="healthy"
          subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""}`}
        />
        <MetricCard
          title="Total Spent"
          value={`$${(totalSpent / 1000).toFixed(1)}k`}
          status={isRisk ? "risk" : isWarning ? "warning" : "healthy"}
          subtitle={`${spentPercent.toFixed(1)}% of budget`}
        />
        <MetricCard
          title="Remaining Balance"
          value={`$${(totalRemaining / 1000).toFixed(1)}k`}
          status={totalRemaining >= 0 ? "healthy" : "risk"}
          subtitle={`Available funds`}
        />
        <MetricCard
          title="Event Revenue"
          value={`$${(totalEventRevenue / 1000).toFixed(1)}k`}
          status="healthy"
          subtitle={`${eventPlans.length} event${eventPlans.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Plans Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Plan Summary</h2>
          <Link href="/plans">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {plans.length === 0 ? (
          <Card className="border border-border bg-card/50 p-8 text-center">
            <p className="text-muted-foreground">No plans created yet.</p>
            <Link href="/plans">
              <Button className="mt-4">Create First Plan</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const planSpent = plan.expenses.reduce(
                (sum, e) => sum + e.spentAmount,
                0
              );
              const planRemaining = plan.budget - planSpent;
              const planSpentPercent =
                plan.budget > 0 ? (planSpent / plan.budget) * 100 : 0;
              const planIsWarning = planSpentPercent > 75;
              const planIsRisk = planSpentPercent > 90;

              const getStatusColor = () => {
                if (plan.status === "completed")
                  return "bg-muted text-muted-foreground";
                if (planIsRisk) return "bg-danger text-danger-foreground";
                if (planIsWarning)
                  return "bg-warning text-warning-foreground";
                return "bg-success text-success-foreground";
              };

              const getStatusLabel = () => {
                if (plan.status === "completed") return "Completed";
                if (planIsRisk) return "At Risk";
                if (planIsWarning) return "Warning";
                return "Healthy";
              };

              return (
                <Card
                  key={plan.id}
                  className="border border-border bg-card p-4 transition-all hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {plan.name}
                      </h3>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {plan.type === "project" ? "Project" : "Event"}
                        </Badge>
                        <Badge
                          className={`text-xs ${getStatusColor()}`}
                        >
                          {getStatusLabel()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-semibold">
                        ${planSpent.toLocaleString()} /{" "}
                        ${plan.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all ${
                          planIsRisk
                            ? "bg-danger"
                            : planIsWarning
                              ? "bg-warning"
                              : "bg-success"
                        }`}
                        style={{ width: `${Math.min(planSpentPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <Link href={`/plans/${plan.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 bg-transparent"
                    >
                      View Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
