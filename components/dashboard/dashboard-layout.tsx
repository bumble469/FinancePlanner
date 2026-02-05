"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { OverviewSection } from "./sections/overview-section";
import { TeamSection } from "./sections/team-section";
import { ExpenseSection } from "./sections/expense-section";
import { EventSection } from "./sections/event-section";
import { SimulationSection } from "./sections/simulation-section";
import { Menu, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFinancialStore } from "@/lib/store";
import type { Plan } from "@/lib/types";

interface DashboardLayoutProps {
  planId: string;
}

/**
 * DashboardLayout - Plan-scoped dashboard
 * 
 * This component is rendered for /plans/[planId] routes
 * It loads the specific plan and displays dashboard sections
 * 
 * Data Flow:
 * Plan (from store)
 *   ├── Sidebar navigation (Dashboard, Expenses, Team, Simulation)
 *   ├── Overview section (plan metrics)
 *   ├── Team section (plan members)
 *   ├── Expense section (plan expenses)
 *   ├── Event section (if plan.type === "event")
 *   └── Simulation section
 */

export function DashboardLayout({ planId }: DashboardLayoutProps) {
  const router = useRouter();
  const { plans, syncToPlan, getCurrentPlan } = useFinancialStore();
  const [activeSection, setActiveSection] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);

  // Load and sync plan on mount
  useEffect(() => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      syncToPlan(planId, plan);
      setCurrentPlan(plan);
    } else {
      // Plan not found, redirect to plans list
      router.push("/plans");
    }
  }, [planId, plans, syncToPlan, router]);

  if (!currentPlan) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading plan...</p>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection />;
      case "team":
        return <TeamSection />;
      case "expenses":
        return <ExpenseSection />;
      case "event":
        return <EventSection />;
      case "simulation":
        return <SimulationSection />;
      default:
        return <OverviewSection />;
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          planName={currentPlan.name}
        />
      </div>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/plans")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <span className="text-xs font-bold text-primary-foreground">$</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground">
                {currentPlan.type === "project" ? "Project" : "Event"}
              </span>
              <span className="text-sm font-semibold text-foreground line-clamp-1">
                {currentPlan.name}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 transform transition-transform duration-200 lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">{renderSection()}</div>
      </main>
    </div>
  );
}
