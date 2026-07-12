"use client";

import React from "react"

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { FinancialStatus } from "@/lib/types";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  status?: FinancialStatus;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  isSimulated?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  status = "healthy",
  trend,
  trendValue,
  icon,
  isSimulated = false,
}: MetricCardProps) {
  const statusColors: Record<FinancialStatus, string> = {
    healthy: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    risk: "border-danger/30 bg-danger/5",
  };

  const statusTextColors: Record<FinancialStatus, string> = {
    healthy: "text-success",
    warning: "text-warning",
    risk: "text-danger",
  };

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "relative rounded-xl border p-5 transition-all",
        statusColors[status],
        isSimulated && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
      )}
    >
      {isSimulated && (
        <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          Simulated
        </span>
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn("mt-1 text-2xl font-bold", statusTextColors[status])}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              status === "healthy" && "bg-success/20 text-success",
              status === "warning" && "bg-warning/20 text-warning",
              status === "risk" && "bg-danger/20 text-danger"
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1.5">
          <TrendIcon
            className={cn(
              "h-4 w-4",
              trend === "up" && "text-success",
              trend === "down" && "text-danger",
              trend === "neutral" && "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-sm font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-danger",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {trendValue}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
