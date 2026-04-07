"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Receipt,
  CalendarDays,
  FlaskConical,
} from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  planName?: string;
  entityName: string;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "team", label: "Team & Roles", icon: Users },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "event", label: "Planning", icon: CalendarDays },
  { id: "simulation", label: "What-If Mode", icon: FlaskConical },
];

export function Sidebar({
  activeSection,
  onSectionChange,
  planName,
  entityName,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      
      {/* ✅ Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-border p-6">
        <Image
          src="/web_logo.png"
          alt="FinanceFlow Logo"
          width={40}
          height={40}
          className="rounded-lg"
        />
        <div>
          <h1 className="font-semibold text-sidebar-foreground">
            FinanceFlow
          </h1>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {planName || "Plan Dashboard"}
          </p>
        </div>
      </div>

      {/* ❌ REMOVED: Mode / Company / Event section */}

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

      {/* ✅ Entity Info (clean) */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">
            Project / Event
          </p>
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {entityName}
          </p>
        </div>
      </div>
    </aside>
  );
}