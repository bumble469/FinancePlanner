"use client";

import { useEffect, useState } from "react";
import { useFinancialStore } from "@/lib/store";
import { MetricCard } from "@/components/dashboard/components/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { ArrowRight, Plus, Receipt, Users, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { Plan } from "@/lib/types";


export function OverviewPage() {
  const { currentUser, setPlans } = useFinancialStore();
  const [myPlans, setMyPlans] = useState<Plan[]>([]);
  const [collaborations, setCollaborations] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Helper function from your plans-page to map the API response
  const mapWorkItemToPlan = (workItem: any): Plan => ({
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
    project: workItem.project ?? null,
    event: workItem.event ?? null,
    expenses: [],
    mode: workItem.type === "EVENT" ? "event" : "project",
    simulation: { costMultiplier: 1, additionalMembers: 0, revenueAdjustment: 0, isSimulating: false }
  });
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await authClient.request("/api/plan", { method: "GET" });
        const fetchedMyPlans = data.data.myPlans.map(mapWorkItemToPlan);
        const fetchedCollaborations = data.data.collaborations.map(mapWorkItemToPlan);

        setMyPlans(fetchedMyPlans);
        setCollaborations(fetchedCollaborations);
        // Also update global store if needed
        setPlans(fetchedMyPlans);
      } catch (error) {
        console.error("Failed to fetch plans", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, [setPlans]);
  // Combine both arrays if you want to show metrics for ALL plans you have access to
  const allActivePlans = [...myPlans, ...collaborations];
  const myTotalBudget = allActivePlans.reduce((sum, p) => sum + p.budget, 0);
  const myTotalSpent = allActivePlans.reduce((sum, p) => {
    // Make sure expenses are loaded, if not, use p.spent or 0
    return sum + (p.expenses?.reduce((esum, e) => esum + e.amount, 0) || 0);
  }, 0);
  const riskPlansCount = allActivePlans.filter(p => {
    const spent = p.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
    const pct = p.budget > 0 ? (spent / p.budget) * 100 : 0;
    return pct > 75;
  }).length;

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Personalized Header */}
      {/* Personalized Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome back, {currentUser?.name || currentUser?.email?.split('@')[0] || "User"} 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Here is what's happening with your plans today.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" className="gap-2 rounded-full px-5 hover:bg-secondary/80">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Log Expense
        </Button>
        <Button variant="secondary" className="gap-2 rounded-full px-5 hover:bg-secondary/80">
          <Users className="h-4 w-4 text-muted-foreground" />
          Invite Team
        </Button>
        <Button variant="secondary" className="gap-2 rounded-full px-5 hover:bg-secondary/80">
          <Clock className="h-4 w-4 text-muted-foreground" />
          View Schedule
        </Button>
      </div>

      {/* High-level Metrics (Personalized) */}
      {/* High-level Metrics (Personalized) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Owned Plans"
          value={myPlans.length.toString()}
          status="healthy"
          subtitle="Plans where you are Admin"
        />
        <MetricCard
          title="Collaborations"
          value={collaborations.length.toString()}
          status="healthy"
          subtitle="Plans shared with you"
        />
        <MetricCard
          title="Total Budget Managed"
          value={`${(myTotalBudget / 1000).toFixed(1)}k`}
          status="healthy"
          subtitle={`${(myTotalSpent / 1000).toFixed(1)}k spent`}
        />
        <MetricCard
          title="Action Required"
          value={riskPlansCount.toString()}
          status={riskPlansCount > 0 ? "risk" : "healthy"}
          subtitle="Plans near budget limit"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content Area (Plans) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">My Plans</h2>
            <Link href="/plans">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-transparent hover:text-primary">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {allActivePlans.length === 0 ? (
            <Card className="flex flex-col items-center justify-center border-dashed bg-card/50 p-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No active plans</h3>
              <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                You aren't a part of any plans right now. Create a new plan or ask your team to invite you.
              </p>
              <Link href="/plans">
                <Button>Create First Plan</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {allActivePlans.map((plan) => {
                const planSpent = plan?.expenses.reduce(
                  (sum, e) => sum + e.amount,
                  0
                );
                const planSpentPercent =
                  plan.budget > 0 ? (planSpent / plan.budget) * 100 : 0;
                const planIsWarning = planSpentPercent > 75;
                const planIsRisk = planSpentPercent > 90;

                const getStatusColor = () => {
                  if (plan.status === "completed") return "bg-muted text-muted-foreground border-transparent";
                  if (planIsRisk) return "bg-danger/10 text-danger border-danger/20";
                  if (planIsWarning) return "bg-warning/10 text-warning-700 dark:text-warning border-warning/20";
                  return "bg-success/10 text-success-700 dark:text-success border-success/20";
                };

                const getProgressBarColor = () => {
                  if (planIsRisk) return "bg-danger";
                  if (planIsWarning) return "bg-warning";
                  return "bg-success";
                };

                const getStatusLabel = () => {
                  if (plan.status === "completed") return "Completed";
                  if (planIsRisk) return "At Risk";
                  if (planIsWarning) return "Warning";
                  return "On Track";
                };

                return (
                  <Link key={plan.id} href={`/plans/${plan.id}`}>
                    <Card
                      className="group flex h-full cursor-pointer flex-col justify-between border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <h3 className="font-semibold leading-none tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {plan.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {plan.type}
                              </span>
                              <span className="text-muted-foreground/30">•</span>
                              <span className="text-xs text-muted-foreground">Owner</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={`whitespace-nowrap px-2 py-0.5 font-medium ${getStatusColor()}`}>
                            {getStatusLabel()}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-end justify-between text-sm">
                            <div className="space-y-0.5">
                              <span className="text-muted-foreground text-xs block">Spent</span>
                              <span className="font-semibold">{plan.currency} {planSpent.toLocaleString()}</span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="text-muted-foreground text-xs block">Budget</span>
                              <span className="font-medium text-muted-foreground">{plan.currency} {plan.budget.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className={`absolute left-0 top-0 h-full transition-all duration-500 ease-in-out ${getProgressBarColor()}`}
                              style={{ width: `${Math.min(planSpentPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                        <div className="flex -space-x-2 overflow-hidden">
                          <Avatar className="inline-block h-6 w-6 rounded-full border-2 border-background">
                            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">ME</AvatarFallback>
                          </Avatar>
                          <Avatar className="inline-block h-6 w-6 rounded-full border-2 border-background">
                            <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-500">JD</AvatarFallback>
                          </Avatar>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-medium text-muted-foreground">
                            +2
                          </div>
                        </div>
                        <div className="flex items-center text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-primary">
                          Open <ArrowRight className="ml-1 h-3 w-3" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar / Secondary Content Area */}
        <div className="space-y-6">

          <Card className="p-5 bg-primary/5 border-primary/10">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/20 p-2 mt-1">
                <AlertCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Weekly Tip</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Set automated alerts on your plans when they cross 80% of the allocated budget to avoid overspending.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
