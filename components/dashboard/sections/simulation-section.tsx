"use client";

import { useFinancialStore, calculateMetrics } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  FlaskConical,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ArrowUpDown,
  Wallet,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100 - 100).toFixed(0)}%`;
}

export function SimulationSection() {
  const {
    simulation,
    updateSimulation,
    resetSimulation,
    expenses,
    mode,
    eventData,
  } = useFinancialStore();

  // Calculate actual vs simulated metrics
  const actualMetrics = calculateMetrics(
    expenses,
    { costMultiplier: 1, additionalMembers: 0, revenueAdjustment: 0, isSimulating: false },
    mode,
    eventData
  );

  const simulatedMetrics = calculateMetrics(
    expenses,
    simulation,
    mode,
    eventData
  );

  const spentDiff = simulatedMetrics.totalSpent - actualMetrics.totalSpent;
  const balanceDiff =
    simulatedMetrics.remainingBalance - actualMetrics.remainingBalance;
  const profitDiff =
    simulatedMetrics.estimatedProfitLoss - actualMetrics.estimatedProfitLoss;

  const handleToggleSimulation = (enabled: boolean) => {
    if (enabled) {
      updateSimulation({ isSimulating: true });
    } else {
      resetSimulation();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Simulation / What-If Mode
          </h1>
          <p className="mt-1 text-muted-foreground">
            Explore hypothetical scenarios and see instant impact on your finances
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
            <FlaskConical
              className={cn(
                "h-5 w-5 transition-colors",
                simulation.isSimulating ? "text-primary" : "text-muted-foreground"
              )}
            />
            <Label htmlFor="sim-toggle" className="text-sm font-medium">
              Simulation
            </Label>
            <Switch
              id="sim-toggle"
              checked={simulation.isSimulating}
              onCheckedChange={handleToggleSimulation}
            />
          </div>
          {simulation.isSimulating && (
            <Button variant="outline" onClick={resetSimulation} className="gap-2 bg-transparent">
              <RefreshCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Simulation Status Banner */}
      {simulation.isSimulating && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-foreground">Simulation Mode Active</p>
            <p className="text-sm text-muted-foreground">
              Dashboard metrics now show simulated values. Adjust controls below to
              explore scenarios.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Controls */}
        <div className="space-y-6 lg:col-span-2">
          {/* Cost Multiplier */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <ArrowUpDown className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Cost Adjustment</h3>
                  <p className="text-sm text-muted-foreground">
                    Simulate cost increases or decreases
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "text-xl font-bold",
                    simulation.costMultiplier > 1
                      ? "text-danger"
                      : simulation.costMultiplier < 1
                        ? "text-success"
                        : "text-foreground"
                  )}
                >
                  {formatPercent(simulation.costMultiplier)}
                </span>
                <p className="text-xs text-muted-foreground">from actual</p>
              </div>
            </div>
            <div className="mt-6">
              <Slider
                value={[simulation.costMultiplier * 100]}
                onValueChange={([v]) =>
                  updateSimulation({ costMultiplier: v / 100, isSimulating: true })
                }
                min={50}
                max={200}
                step={5}
                className="py-2"
                disabled={!simulation.isSimulating}
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>-50% costs</span>
                <span>No change</span>
                <span>+100% costs</span>
              </div>
            </div>
          </div>

          {/* Additional Team Members */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Hypothetical Team Members
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add imaginary team members (avg. $8,000/mo each)
                  </p>
                </div>
              </div>
              <span className="text-xl font-bold text-foreground">
                +{simulation.additionalMembers}
              </span>
            </div>
            <div className="mt-6">
              <Slider
                value={[simulation.additionalMembers]}
                onValueChange={([v]) =>
                  updateSimulation({ additionalMembers: v, isSimulating: true })
                }
                min={0}
                max={20}
                step={1}
                className="py-2"
                disabled={!simulation.isSimulating}
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>No additions</span>
                <span>+{formatCurrency(simulation.additionalMembers * 8000)}/mo</span>
                <span>+20 members</span>
              </div>
            </div>
          </div>

          {/* Revenue Adjustment (Event Mode) */}
          {mode === "event" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Revenue Adjustment
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Simulate additional or reduced event revenue
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xl font-bold",
                    simulation.revenueAdjustment >= 0 ? "text-success" : "text-danger"
                  )}
                >
                  {simulation.revenueAdjustment >= 0 ? "+" : ""}
                  {formatCurrency(simulation.revenueAdjustment)}
                </span>
              </div>
              <div className="mt-6">
                <Slider
                  value={[simulation.revenueAdjustment]}
                  onValueChange={([v]) =>
                    updateSimulation({ revenueAdjustment: v, isSimulating: true })
                  }
                  min={-50000}
                  max={50000}
                  step={1000}
                  className="py-2"
                  disabled={!simulation.isSimulating}
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>-$50,000</span>
                  <span>No change</span>
                  <span>+$50,000</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Comparison */}
        <div className="space-y-4">
          {/* Actual vs Simulated Header */}
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
            <div className="flex-1 text-center">
              <p className="text-xs font-medium text-muted-foreground">ACTUAL</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex-1 text-center">
              <p className="text-xs font-medium text-primary">SIMULATED</p>
            </div>
          </div>

          {/* Total Spent Comparison */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-sm text-muted-foreground">Total Spent</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg text-foreground">
                {formatCurrency(actualMetrics.totalSpent)}
              </span>
              <span
                className={cn(
                  "font-mono text-lg font-bold",
                  simulation.isSimulating
                    ? spentDiff > 0
                      ? "text-danger"
                      : "text-success"
                    : "text-foreground"
                )}
              >
                {formatCurrency(simulatedMetrics.totalSpent)}
              </span>
            </div>
            {simulation.isSimulating && spentDiff !== 0 && (
              <div
                className={cn(
                  "mt-2 flex items-center gap-1 text-sm",
                  spentDiff > 0 ? "text-danger" : "text-success"
                )}
              >
                {spentDiff > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {spentDiff > 0 ? "+" : ""}
                {formatCurrency(spentDiff)}
              </div>
            )}
          </div>

          {/* Remaining Balance Comparison */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-sm text-muted-foreground">Remaining Balance</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg text-foreground">
                {formatCurrency(actualMetrics.remainingBalance)}
              </span>
              <span
                className={cn(
                  "font-mono text-lg font-bold",
                  simulation.isSimulating
                    ? balanceDiff < 0
                      ? "text-danger"
                      : "text-success"
                    : "text-foreground"
                )}
              >
                {formatCurrency(simulatedMetrics.remainingBalance)}
              </span>
            </div>
            {simulation.isSimulating && balanceDiff !== 0 && (
              <div
                className={cn(
                  "mt-2 flex items-center gap-1 text-sm",
                  balanceDiff < 0 ? "text-danger" : "text-success"
                )}
              >
                {balanceDiff < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {balanceDiff > 0 ? "+" : ""}
                {formatCurrency(balanceDiff)}
              </div>
            )}
          </div>

          {/* Profit/Loss Comparison */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-sm text-muted-foreground">Est. Profit/Loss</p>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "font-mono text-lg",
                  actualMetrics.estimatedProfitLoss >= 0
                    ? "text-success"
                    : "text-danger"
                )}
              >
                {formatCurrency(actualMetrics.estimatedProfitLoss)}
              </span>
              <span
                className={cn(
                  "font-mono text-lg font-bold",
                  simulatedMetrics.estimatedProfitLoss >= 0
                    ? "text-success"
                    : "text-danger"
                )}
              >
                {formatCurrency(simulatedMetrics.estimatedProfitLoss)}
              </span>
            </div>
            {simulation.isSimulating && profitDiff !== 0 && (
              <div
                className={cn(
                  "mt-2 flex items-center gap-1 text-sm",
                  profitDiff < 0 ? "text-danger" : "text-success"
                )}
              >
                {profitDiff < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {profitDiff > 0 ? "+" : ""}
                {formatCurrency(profitDiff)}
              </div>
            )}
          </div>

          {/* Warning */}
          {simulation.isSimulating &&
            simulatedMetrics.remainingBalance < 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <div>
                  <p className="text-sm font-medium text-danger">Budget Exceeded</p>
                  <p className="text-xs text-muted-foreground">
                    This scenario would result in overspending
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
