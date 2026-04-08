"use client";

import { useFinancialStore } from "@/lib/store";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SplinePlaceholder } from "@/components/dashboard/spline-placeholder";
import {
  Wallet,
  ArrowDownCircle,
  PiggyBank,
  TrendingUp,
  Info,
} from "lucide-react";
import type { FinancialStatus } from "@/lib/types";
import { getCurrencySymbol } from "@/lib/currency";

function formatCurrency(value: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${value.toLocaleString("en-IN")}`;
}

function getStatus(value: number, threshold: number): FinancialStatus {
  if (threshold === 0) return "risk";
  const ratio = value / threshold;
  if (ratio >= 0.7) return "healthy";
  if (ratio >= 0.3) return "warning";
  return "risk";
}

export function OverviewSection() {
  const { expenses, simulation, eventData, departments, currency } = useFinancialStore();
  const totalBudget = eventData.eventBudget;

  const totalAllocated = departments.reduce(
    (sum, d) => sum + Number(d.budget || 0),
    0
  );

  const remainingBalance = totalBudget - totalAllocated;

  const totalSpent = expenses.reduce(
    (sum, e) => sum + (e.spentAmount || 0),
    0
  );

  const estimatedProfitLoss =
    eventData.expectedRevenue - eventData.eventBudget;

  const balanceStatus = getStatus(remainingBalance, totalBudget);

  const profitStatus =
    estimatedProfitLoss >= 0
      ? "healthy"
      : estimatedProfitLoss > -10000
        ? "warning"
        : "risk";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Event Overview
          </h1>
          <p className="mt-1 text-muted-foreground">
            Event budget and revenue tracking
          </p>
        </div>

        {simulation.isSimulating && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-primary">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">Simulation Active</span>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Budget"
          value={formatCurrency(totalBudget, currency)}
          status="healthy"
          icon={<Wallet className="h-5 w-5" />}
          isSimulated={simulation.isSimulating}
        />

        <MetricCard
          title="Total Allocated"
          value={formatCurrency(totalAllocated, currency)}
          subtitle={`${(totalBudget > 0
            ? (totalAllocated / totalBudget) * 100
            : 0).toFixed(
              1
            )}% allocated`}
          status={
            totalAllocated / totalBudget > 0.9 ? "warning" : "healthy"
          }
          icon={<ArrowDownCircle className="h-5 w-5" />}
          isSimulated={simulation.isSimulating}
        />

        <MetricCard
          title="Remaining Balance"
          value={formatCurrency(remainingBalance, currency)}
          status={balanceStatus}
          trend={balanceStatus === "healthy" ? "up" : "down"}
          icon={<PiggyBank className="h-5 w-5" />}
          isSimulated={simulation.isSimulating}
        />

        <MetricCard
          title="Profit / Loss"
          value={formatCurrency(estimatedProfitLoss, currency)}
          status={profitStatus}
          trend={estimatedProfitLoss >= 0 ? "up" : "down"}
          icon={<TrendingUp className="h-5 w-5" />}
          isSimulated={simulation.isSimulating}
        />
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SplinePlaceholder
            title="3D Financial Scene"
            description="Budget allocation and department flow in real-time"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Info className="h-4 w-4 text-primary" />
              Summary
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Budget is distributed across departments. Remaining balance shows
              how much is left to allocate. Profit/loss is based on expected
              revenue vs expenses.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Quick Stats</h3>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Departments
                </span>
                <span className="font-medium text-foreground">
                  {departments.length}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Over Budget
                </span>
                <span className="font-medium text-danger">
                  {remainingBalance < 0 ? 1 : 0}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Utilization
                </span>
                <span className="font-medium text-foreground">
                  {((totalAllocated / totalBudget) * 100 || 0).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}