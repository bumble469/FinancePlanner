"use client";

import { useFinancialStore, calculateMetrics } from "@/lib/store";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Pencil, Check } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatus(value: number, threshold: number): FinancialStatus {
  const ratio = value / threshold;
  if (ratio >= 0.7) return "healthy";
  if (ratio >= 0.3) return "warning";
  return "risk";
}

export function OverviewSection() {
  const { entityName, setEntityName, expenses, simulation, mode, eventData } =
    useFinancialStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(entityName);

  const metrics = calculateMetrics(expenses, simulation, mode, eventData);

  const balanceStatus = getStatus(metrics.remainingBalance, metrics.totalBudget);
  const profitStatus =
    metrics.estimatedProfitLoss >= 0
      ? "healthy"
      : metrics.estimatedProfitLoss > -10000
        ? "warning"
        : "risk";

  const handleSaveName = () => {
    setEntityName(tempName);
    setIsEditingName(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="h-10 w-64 text-xl font-bold"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  {entityName}
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditingName(true)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            {mode === "company"
              ? "Financial overview for your organization"
              : "Event budget and revenue tracking"}
          </p>
        </div>
        {simulation.isSimulating && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-primary">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">Simulation Active</span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Budget"
          value={formatCurrency(metrics.totalBudget)}
          status="healthy"
          icon={<Wallet className="h-5 w-5" />}
          isSimulated={simulation.isSimulating}
        />
        <MetricCard
          title="Total Spent"
          value={formatCurrency(metrics.totalSpent)}
          subtitle={`${((metrics.totalSpent / metrics.totalBudget) * 100).toFixed(1)}% of budget`}
          status={
            metrics.totalSpent / metrics.totalBudget > 0.9 ? "warning" : "healthy"
          }
          trend="up"
          trendValue="12.5%"
          icon={<ArrowDownCircle className="h-5 w-5" />}
          isSimulated={simulation.isSimulating}
        />
        <MetricCard
          title="Remaining Balance"
          value={formatCurrency(metrics.remainingBalance)}
          status={balanceStatus}
          trend={balanceStatus === "healthy" ? "up" : "down"}
          trendValue={balanceStatus === "healthy" ? "8.2%" : "-5.3%"}
          icon={<PiggyBank className="h-5 w-5" />}
          isSimulated={simulation.isSimulating}
        />
        <MetricCard
          title={mode === "company" ? "Est. Profit/Loss" : "Event Profit/Loss"}
          value={formatCurrency(metrics.estimatedProfitLoss)}
          status={profitStatus}
          trend={metrics.estimatedProfitLoss >= 0 ? "up" : "down"}
          trendValue={metrics.estimatedProfitLoss >= 0 ? "+15.7%" : "-8.4%"}
          icon={<TrendingUp className="h-5 w-5" />}
          isSimulated={simulation.isSimulating}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 3D Visualization Placeholder - Takes 2 columns */}
        <div className="lg:col-span-2">
          <SplinePlaceholder
            title="3D Financial Scene"
            description="Your budget flows and expense categories visualized in real-time"
          />
        </div>

        {/* Side Panel - Explanation */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Info className="h-4 w-4 text-primary" />
              About This View
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The 3D visualization represents your financial data as a physical
              system. Money flows from your budget through different expense
              categories, with visual indicators showing spending velocity and
              remaining capacity.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                Green objects: Healthy budgets
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning" />
                Yellow objects: Approaching limit
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger" />
                Red objects: Over budget
              </li>
            </ul>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">Quick Stats</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expense Categories</span>
                <span className="font-medium text-foreground">
                  {expenses.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Over Budget</span>
                <span className="font-medium text-danger">
                  {expenses.filter((e) => e.spentAmount > e.allocatedBudget).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budget Utilization</span>
                <span className="font-medium text-foreground">
                  {((metrics.totalSpent / metrics.totalBudget) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
