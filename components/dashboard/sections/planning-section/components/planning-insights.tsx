"use client";

import { CheckCircle2, Clock, AlertTriangle, CalendarClock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Milestone, MilestoneStatus } from "@/lib/types";

function isOverdue(dueDate?: string, status?: string) {
  if (!dueDate) return false;
  if (status === "DONE" || status === "ACHIEVED") return false;
  return new Date(dueDate).getTime() < Date.now();
}

function InsightCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-destructive",
  }[tone ?? "default"];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn("h-3.5 w-3.5", toneClass)} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={cn("text-xl font-bold", toneClass)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function PlanningInsights({ milestones }: { milestones: Milestone[] }) {
  const allTasks = milestones.flatMap((m) => m.tasks);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "DONE").length;
  const ongoingTasks = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const blockedTasks = allTasks.filter((t) => t.status === "BLOCKED").length;
  const overdueTasks = allTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const extendedTasks = allTasks.filter((t) => !!t.originalDueDate).length;

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const milestoneProgress = (() => {
    if (milestones.length === 0) return 0;
    const sum = milestones.reduce((acc, m) => {
      if (m.tasks.length === 0) return acc;
      return acc + (m.tasks.filter((t) => t.status === "DONE").length / m.tasks.length);
    }, 0);
    return Math.round((sum / milestones.length) * 100);
  })();

  const overdueMilestones = milestones.filter((m) => isOverdue(m.dueDate, m.status)).length;

  const upcoming = allTasks
    .filter((t) => t.dueDate && t.status !== "DONE")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <InsightCard icon={TrendingUp} label="Overall progress" value={`${overallProgress}%`} tone={overallProgress === 100 ? "success" : "default"} />
        <InsightCard icon={TrendingUp} label="Milestone progress" value={`${milestoneProgress}%`} />
        <InsightCard icon={CheckCircle2} label="Completed tasks" value={completedTasks} sub={`of ${totalTasks}`} tone="success" />
        <InsightCard icon={Clock} label="Ongoing tasks" value={ongoingTasks} tone="warning" />
        <InsightCard icon={AlertTriangle} label="Overdue" value={overdueTasks + overdueMilestones} sub={`${overdueTasks} tasks, ${overdueMilestones} milestones`} tone={overdueTasks + overdueMilestones > 0 ? "danger" : "default"} />
        <InsightCard icon={CalendarClock} label="Extended deadlines" value={extendedTasks} />
      </div>

      {upcoming.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Upcoming deadlines</p>
          <div className="space-y-1.5">
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground truncate">{t.title}</span>
                <span className={cn("text-xs shrink-0 ml-2", isOverdue(t.dueDate, t.status) ? "text-destructive font-medium" : "text-muted-foreground")}>
                  {new Date(t.dueDate!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}