"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Milestone } from "@/lib/types";

type ViewMode = "project" | "month" | "week" | "custom";

interface GanttChartProps {
  milestones: Milestone[];
  projectRange: { start: Date; end: Date } | null;
  compact?: boolean; // true = fluid/shrink-to-fit, no scroll. false = fixed width, horizontal scroll.
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysBetween(a: Date, b: Date) {
  return (startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  return addDays(x, -day);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// Keeps edge-of-axis labels fully inside the container instead of overflowing
function tickTransform(offsetPct: number) {
  if (offsetPct <= 1) return "translate-x-0";
  if (offsetPct >= 99) return "-translate-x-full";
  return "-translate-x-1/2";
}

type BarState = "completed" | "in_progress" | "delayed" | "upcoming";

function getBarState(status: string, dueDate?: string): BarState {
  if (status === "DONE" || status === "ACHIEVED") return "completed";
  const overdue = dueDate ? new Date(dueDate).getTime() < Date.now() : false;
  if (overdue) return "delayed";
  if (status === "IN_PROGRESS") return "in_progress";
  return "upcoming";
}

const BAR_COLOR: Record<BarState, string> = {
  completed: "bg-green-500/70 border-green-600",
  in_progress: "bg-blue-500/70 border-blue-600",
  delayed: "bg-destructive/70 border-destructive",
  upcoming: "bg-muted-foreground/30 border-muted-foreground/50",
};

function earliestMilestoneStart(m: Milestone): Date {
  const dates = m.tasks
    .map((t) => t.startDate)
    .filter(Boolean)
    .map((d) => new Date(d!));
  if (dates.length > 0) return new Date(Math.min(...dates.map((d) => d.getTime())));
  return new Date(m.dueDate!);
}


export function TimelineChart({ milestones, projectRange, compact = true }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("project");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const { rangeStart, rangeEnd } = useMemo(() => {
    const today = new Date();
    const base = projectRange ?? { start: today, end: addDays(today, 30) };

    if (viewMode === "month") {
      return { rangeStart: startOfMonth(today), rangeEnd: endOfMonth(today) };
    }
    if (viewMode === "week") {
      return { rangeStart: startOfWeek(today), rangeEnd: addDays(startOfWeek(today), 6) };
    }
    if (viewMode === "custom" && customStart && customEnd) {
      const s = new Date(customStart);
      const e = new Date(customEnd);
      if (e > s) return { rangeStart: s, rangeEnd: e };
    }
    return { rangeStart: startOfDay(base.start), rangeEnd: startOfDay(base.end) };
  }, [viewMode, projectRange, customStart, customEnd]);

  const totalDays = Math.max(1, daysBetween(rangeStart, rangeEnd));

  const ticks = useMemo(() => {
    if (viewMode === "week" || totalDays <= 14) {
      return Array.from({ length: totalDays + 1 }, (_, i) => {
        const d = addDays(rangeStart, i);
        return { offset: (i / totalDays) * 100, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) };
      });
    }
    const result: { offset: number; label: string }[] = [];
    let cursor = startOfMonth(rangeStart);
    while (cursor <= rangeEnd) {
      const rawOffset = (daysBetween(rangeStart, cursor) / totalDays) * 100;
      const offset = Math.max(0, rawOffset);
      result.push({ offset, label: cursor.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return result;
  }, [rangeStart, rangeEnd, totalDays, viewMode]);

  const todayOffset = daysBetween(rangeStart, new Date());
  const showToday = todayOffset >= 0 && todayOffset <= totalDays;

  const barPosition = (start: Date, end: Date) => {
    const clampedStart = start < rangeStart ? rangeStart : start;
    const clampedEnd = end > rangeEnd ? rangeEnd : end;
    const offset = Math.max(0, (daysBetween(rangeStart, clampedStart) / totalDays) * 100);
    const width = Math.max(1, (daysBetween(clampedStart, clampedEnd) / totalDays) * 100);
    const outOfRange = end < rangeStart || start > rangeEnd;
    return { offset, width, outOfRange };
  };

  if (milestones.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No milestones yet — add one to see the project timeline.
      </div>
    );
  }

  return (
    <div className={cn(!compact && "rounded-xl border border-border bg-card p-4", "space-y-4")}>
      {/* view mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-muted/30">
          {([
            { key: "project", label: "Entire Project" },
            { key: "month", label: "Monthly" },
            { key: "week", label: "Weekly" },
            { key: "custom", label: "Custom" },
          ] as { key: ViewMode; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setViewMode(opt.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === opt.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {viewMode === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-8 w-36 text-xs" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-8 w-36 text-xs" />
          </div>
        )}
      </div>

      <div className={cn(compact ? "w-full" : "overflow-x-auto")}>
        <div className={cn(compact ? "w-full" : "min-w-[900px]")}>
          {/* axis */}
          <div className="relative h-6 border-b border-border mb-2">
            {ticks.map((t, i) => (
              <span
                key={i}
                className={cn("absolute top-0 text-[10px] text-muted-foreground whitespace-nowrap", tickTransform(t.offset))}
                style={{ left: `${t.offset}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>

          <div className="relative space-y-1.5">
            {showToday && (
              <div
                className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
                style={{ left: `${(todayOffset / totalDays) * 100}%` }}
                title={`Today — ${new Date().toLocaleDateString("en-IN")}`}
              />
            )}

            {milestones.map((m) => {
              if (!m.dueDate) return null;
              const isExpanded = expanded.has(m.id);
              const mStart = earliestMilestoneStart(m);
              const mEnd = new Date(m.dueDate);
              const { offset, width, outOfRange } = barPosition(mStart, mEnd);
              const state = getBarState(m.status, m.dueDate);
              const progress = m.tasks.length > 0
                ? Math.round((m.tasks.filter((t) => t.status === "DONE").length / m.tasks.length) * 100)
                : (m.status === "ACHIEVED" ? 100 : 0);

              return (
                <div key={m.id}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(m.id)}
                      className={cn("shrink-0 flex items-center gap-1 text-xs font-semibold text-foreground truncate hover:text-primary transition-colors", compact ? "w-28" : "w-44")}
                    >
                      {m.tasks.length > 0 ? (
                        isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
                      ) : (
                        <span className="w-3" />
                      )}
                      <span className="truncate">{m.title}</span>
                    </button>
                    <div className="relative flex-1 h-6 rounded bg-muted/40">
                      {!outOfRange && (
                        <div
                          className={cn("absolute top-0.5 bottom-0.5 rounded-md border overflow-hidden", BAR_COLOR[state])}
                          style={{ left: `${offset}%`, width: `${width}%` }}
                          title={`${m.title} — due ${mEnd.toLocaleDateString("en-IN")}${m.originalDueDate ? ` (extended from ${new Date(m.originalDueDate).toLocaleDateString("en-IN")})` : ""}`}
                        >
                          <div className="h-full bg-white/30" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                      {m.originalDueDate && !outOfRange && (
                        <span
                          className="absolute -top-1 text-[9px]"
                          style={{ left: `calc(${Math.min(offset + width, 97)}% - 6px)` }}
                          title={`Extended: ${m.extensionReason ?? ""}`}
                        >
                          ⏱
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && m.tasks.map((t) => {
                    if (!t.dueDate && !t.startDate) {
                      return (
                        <div key={t.id} className="flex items-center gap-2 mt-1.5">
                          <span className={cn("shrink-0 pl-4 text-xs text-muted-foreground truncate", compact ? "w-28" : "w-44")}>{t.title}</span>
                          <span className="flex-1 text-[10px] text-muted-foreground/60 italic">No dates set</span>
                        </div>
                      );
                    }
                    const tStart = t.startDate ? new Date(t.startDate) : new Date(t.dueDate!);
                    const tEnd = t.dueDate ? new Date(t.dueDate) : new Date(t.startDate!);
                    const taskPos = barPosition(tStart, tEnd);
                    const taskState = getBarState(t.status, t.dueDate);

                    return (
                      <div key={t.id} className="flex items-center gap-2 mt-1.5">
                        <span className={cn("shrink-0 pl-4 text-xs text-muted-foreground truncate", compact ? "w-28" : "w-44")}>{t.title}</span>
                        <div className="relative flex-1 h-5 rounded bg-muted/20">
                          {!taskPos.outOfRange && (
                            <div
                              className={cn("absolute top-0.5 bottom-0.5 rounded border overflow-hidden", BAR_COLOR[taskState])}
                              style={{ left: `${taskPos.offset}%`, width: `${taskPos.width}%` }}
                              title={`${t.title} — ${tStart.toLocaleDateString("en-IN")} to ${tEnd.toLocaleDateString("en-IN")}${t.originalDueDate ? " (extended)" : ""}`}
                            >
                              {t.status === "DONE" && <div className="h-full w-full bg-white/30" />}
                            </div>
                          )}
                          {t.originalDueDate && !taskPos.outOfRange && (
                            <span
                              className="absolute -top-1 text-[8px]"
                              style={{ left: `calc(${Math.min(taskPos.offset + taskPos.width, 97)}% - 5px)` }}
                              title={`Extended: ${t.extensionReason ?? ""}`}
                            >
                              ⏱
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-green-500/70 border border-green-600" /> Completed</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-500/70 border border-blue-600" /> In Progress</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-destructive/70 border border-destructive" /> Delayed</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-muted-foreground/30 border border-muted-foreground/50" /> Upcoming</span>
            <span className="flex items-center gap-1"><span className="text-yellow-500">⏱</span> Extended</span>
            {showToday && <span className="flex items-center gap-1"><span className="h-2 w-px bg-blue-500 inline-block" /> Today</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimelineChartDialog({
  milestones,
  projectRange,
}: {
  milestones: Milestone[];
  projectRange: { start: Date; end: Date } | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs cursor-pointer hover:text-gray-600" onClick={() => setOpen(true)}>
        <Maximize2 className="h-3.5 w-3.5" />
        View full timeline
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project timeline</DialogTitle>
          </DialogHeader>
          <TimelineChart milestones={milestones} projectRange={projectRange} compact={false} />
        </DialogContent>
      </Dialog>
    </>
  );
}