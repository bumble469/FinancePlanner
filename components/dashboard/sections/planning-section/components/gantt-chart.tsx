"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/lib/types";

interface GanttRow {
  id: string;
  label: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  isMilestone: boolean;
  overdue: boolean;
  extended: boolean;
}

function dayDiff(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

export function GanttChart({ milestones }: { milestones: Milestone[] }) {
  const rows: GanttRow[] = useMemo(() => {
    const result: GanttRow[] = [];

    for (const m of milestones) {
      const taskDates = m.tasks
        .flatMap((t) => [t.startDate, t.dueDate])
        .filter(Boolean)
        .map((d) => new Date(d!));

      const mEnd = m.dueDate ? new Date(m.dueDate) : (taskDates.length > 0 ? new Date(Math.max(...taskDates.map((d) => d.getTime()))) : null);
      const mStart = taskDates.length > 0
        ? new Date(Math.min(...taskDates.map((d) => d.getTime())))
        : mEnd; 

      if (mStart && mEnd) {
        const progress = m.tasks.length > 0
          ? Math.round((m.tasks.filter((t) => t.status === "DONE").length / m.tasks.length) * 100)
          : (m.status === "ACHIEVED" ? 100 : 0);

        result.push({
          id: m.id,
          label: m.title,
          start: mStart,
          end: mEnd,
          progress,
          isMilestone: true,
          overdue: m.status !== "ACHIEVED" && mEnd.getTime() < Date.now(),
          extended: !!m.originalDueDate,
        });
      }

      for (const t of m.tasks) {
        if (!t.startDate && !t.dueDate) continue;
        const start = t.startDate ? new Date(t.startDate) : new Date(t.dueDate!);
        const end = t.dueDate ? new Date(t.dueDate) : new Date(t.startDate!);
        result.push({
          id: t.id,
          label: t.title,
          start,
          end,
          progress: t.status === "DONE" ? 100 : t.status === "IN_PROGRESS" ? 50 : 0,
          isMilestone: false,
          overdue: t.status !== "DONE" && end.getTime() < Date.now(),
          extended: !!t.originalDueDate,
        });
      }
    }

    return result;
  }, [milestones]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No dated milestones or tasks yet — add start/due dates to see them on the timeline.
      </div>
    );
  }

  const allDates = rows.flatMap((r) => [r.start, r.end]);
  const rangeStart = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const rangeEnd = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const totalDays = Math.max(1, dayDiff(rangeStart, rangeEnd));

  const todayOffset = dayDiff(rangeStart, new Date());
  const showToday = todayOffset >= 0 && todayOffset <= totalDays;

  return (
    <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
      <div className="min-w-[600px]">
        {/* header: date range */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 px-1">
          <span>{rangeStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          <span>{rangeEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>

        <div className="relative space-y-2">
          {/* today marker */}
          {showToday && (
            <div
              className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
              style={{ left: `${(todayOffset / totalDays) * 100}%` }}
              title="Today"
            />
          )}

          {rows.map((row) => {
            const offsetPct = (dayDiff(rangeStart, row.start) / totalDays) * 100;
            const widthPct = Math.max(1.5, (dayDiff(row.start, row.end) / totalDays) * 100);

            return (
              <div key={row.id} className="flex items-center gap-3">
                <div className={cn("w-40 shrink-0 text-xs truncate", row.isMilestone ? "font-semibold text-foreground" : "text-muted-foreground pl-3")}>
                  {row.label}
                </div>
                <div className="relative flex-1 h-6 rounded bg-muted/40">
                  <div
                    className={cn(
                      "absolute top-0.5 bottom-0.5 rounded-md flex items-center overflow-hidden",
                      row.overdue
                        ? "bg-destructive/20 border border-destructive/50"
                        : row.isMilestone
                          ? "bg-primary/15 border border-primary/40"
                          : "bg-blue-500/15 border border-blue-500/40"
                    )}
                    style={{ left: `${offsetPct}%`, width: `${widthPct}%` }}
                    title={`${row.label} — ${row.start.toLocaleDateString("en-IN")} to ${row.end.toLocaleDateString("en-IN")}`}
                  >
                    <div
                      className={cn("h-full rounded-md", row.overdue ? "bg-destructive/60" : row.isMilestone ? "bg-primary/60" : "bg-blue-500/60")}
                      style={{ width: `${row.progress}%` }}
                    />
                  </div>
                  {row.extended && (
                    <span
                      className="absolute -top-1 rounded-full bg-yellow-500 text-white text-[8px] px-1 leading-tight"
                      style={{ left: `calc(${offsetPct + widthPct}% - 6px)` }}
                      title="Deadline extended"
                    >
                      ⏱
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary/40 border border-primary/60" /> Milestone</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-500/40 border border-blue-500/60" /> Task</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-destructive/40 border border-destructive/60" /> Overdue</span>
          <span className="flex items-center gap-1"><span className="text-yellow-500">⏱</span> Extended</span>
          {showToday && <span className="flex items-center gap-1"><span className="h-2 w-px bg-blue-500 inline-block" /> Today</span>}
        </div>
      </div>
    </div>
  );
}