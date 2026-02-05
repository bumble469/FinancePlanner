"use client";

import { cn } from "@/lib/utils";
import { useFinancialStore } from "@/lib/store";
import {
  LayoutDashboard,
  Users,
  Receipt,
  CalendarDays,
  FlaskConical,
  Building2,
  PartyPopper,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  planName?: string;
  entityName: string; // Declare entityName in the props interface
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "team", label: "Team & Roles", icon: Users },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "event", label: "Event Planning", icon: CalendarDays },
  { id: "simulation", label: "What-If Mode", icon: FlaskConical },
];

export function Sidebar({ activeSection, onSectionChange, planName, entityName }: SidebarProps) {
  const { mode, setMode, getCurrentPlan } = useFinancialStore();
  const currentPlan = getCurrentPlan();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-border p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <span className="text-lg font-bold text-primary-foreground">$</span>
        </div>
        <div>
          <h1 className="font-semibold text-sidebar-foreground">FinanceFlow</h1>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {planName || currentPlan?.name || "Plan Dashboard"}
          </p>
        </div>
      </div>

      {/* Plan Type Indicator */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2">
            {currentPlan?.mode === "company" ? (
              <Building2 className="h-4 w-4 text-primary" />
            ) : (
              <PartyPopper className="h-4 w-4 text-primary" />
            )}
            <Label
              className="text-sm font-medium text-sidebar-foreground"
            >
              {currentPlan?.mode === "company" ? "Company Mode" : "Event Mode"}
            </Label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {currentPlan?.type === "project" ? "Project Plan" : "Event Plan"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Entity Info */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">
            {mode === "company" ? "Company" : "Event"}
          </p>
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {entityName}
          </p>
        </div>
      </div>
    </aside>
  );
}
