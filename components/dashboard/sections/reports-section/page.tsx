"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Plus,
  StickyNote,
  BarChart3,
  File,
  Trash2,
  Pencil,
  Calendar,
  BookOpen,
  TrendingUp,
  CheckSquare,
  Layers,
  FileDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinancialStore } from "@/lib/store";
import { authClient } from "@/lib/auth-client";
import { getCurrencySymbol } from "@/lib/currency";

// ─── types ───────────────────────────────────────────────────────────────────

type Tab = "documents" | "reports";
type DocType = "document" | "note";
type ReportPeriod = "daily" | "weekly" | "monthly";
type ReportType = "financial" | "activity" | "full";

interface Doc {
  id: string;
  type: DocType;
  title: string;
  content?: string;
  fileName?: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string;
}

// ─── config ──────────────────────────────────────────────────────────────────

const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; icon: typeof TrendingUp; description: string }> = {
  financial: { label: "Financial Report", icon: TrendingUp, description: "Income, expenses, P&L, budget utilization" },
  activity: { label: "Activity Report", icon: CheckSquare, description: "Tasks completed, milestones hit, team activity" },
  full: { label: "Full Report", icon: Layers, description: "Complete overview — finances, work done, team, milestones" },
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  daily: "Today",
  weekly: "This week",
  monthly: "This month",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number, currency: string) {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${value.toLocaleString("en-IN")}`;
}

// ─── DocCard ─────────────────────────────────────────────────────────────────

function DocCard({
  doc,
  onEdit,
  onDelete,
}: {
  doc: Doc;
  onEdit: (d: Doc) => void;
  onDelete: (id: string) => void;
}) {
  const isNote = doc.type === "note";
  return (
    <div className="group relative rounded-xl border border-border bg-card p-4 flex gap-3 hover:border-foreground/20 hover:shadow-sm transition-all">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          isNote ? "bg-yellow-500/10" : "bg-blue-500/10"
        )}
      >
        {isNote ? (
          <StickyNote className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        ) : (
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-foreground truncate">{doc.title}</p>
        {isNote ? (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.content}</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">
            {doc.fileName} · {doc.fileSize}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          · {doc.uploadedBy}
        </p>
      </div>

      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isNote && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onEdit(doc)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {!isNote && (
          <Button size="icon" variant="ghost" className="h-7 w-7">
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(doc.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── ReportPreview — live store data ─────────────────────────────────────────

function ReportPreview({
  period,
  type,
}: {
  period: ReportPeriod;
  type: ReportType;
}) {
  const { income, expenses, tasks, milestones, currency, teamMembers, budget } =
    useFinancialStore();

  const cfg = REPORT_TYPE_CONFIG[type];
  const Icon = cfg.icon;
  const now = new Date();

  function inPeriod(dateStr: string) {
    const d = new Date(dateStr);
    if (period === "daily") return d.toDateString() === now.toDateString();
    if (period === "weekly") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }

  const filteredIncome = income.filter((i) => inPeriod(i.receivedAt));
  const filteredExpenses = expenses.filter((e) => inPeriod(e.occurredAt));

  const totalIncome = filteredIncome.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netPL = totalIncome - totalExpenses;
  const budgetUsedPct =
    budget > 0
      ? Math.round(
        (expenses.reduce((s, e) => s + e.amount, 0) / budget) * 100
      )
      : 0;

  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const achievedMilestones = milestones.filter(
    (m) => m.status === "ACHIEVED"
  ).length;

  const financialData: { label: string; value: string; positive: boolean | null }[] = [
    { label: "Total Income", value: fmt(totalIncome, currency), positive: true },
    { label: "Total Expenses", value: fmt(totalExpenses, currency), positive: false },
    { label: "Net P&L", value: (netPL >= 0 ? "+" : "") + fmt(netPL, currency), positive: netPL >= 0 },
    { label: "Budget Used", value: `${budgetUsedPct}%`, positive: null },
  ];

  const activityData = [
    { label: "Tasks Completed", value: doneTasks.toString() },
    { label: "Tasks In Progress", value: inProgressTasks.toString() },
    { label: "Milestones Achieved", value: achievedMilestones.toString() },
    { label: "Team Members", value: teamMembers.length.toString() },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{cfg.label}</p>
            <p className="text-xs text-muted-foreground">{PERIOD_LABELS[period]}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
          <FileDown className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* body */}
      <div className="p-5 space-y-5">
        {/* date label */}
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {period === "daily" &&
              now.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            {period === "weekly" &&
              "Week of " +
              now.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            {period === "monthly" &&
              now.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
          </span>
        </div>

        {/* financials */}
        {(type === "financial" || type === "full") && (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Financials
            </p>
            <div className="grid grid-cols-2 gap-2">
              {financialData.map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p
                    className={cn(
                      "text-sm font-semibold mt-0.5 font-mono",
                      item.positive === true
                        ? "text-green-600 dark:text-green-400"
                        : item.positive === false
                          ? "text-destructive"
                          : "text-foreground"
                    )}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* activity */}
        {(type === "activity" || type === "full") && (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Activity
            </p>
            <div className="grid grid-cols-2 gap-2">
              {activityData.map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold mt-0.5 text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* milestones */}
        {type === "full" && milestones.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Milestones
            </p>
            <div className="space-y-1.5">
              {milestones.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-xs">
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      m.status === "ACHIEVED"
                        ? "bg-green-500"
                        : m.status === "IN_PROGRESS"
                          ? "bg-yellow-500"
                          : m.status === "MISSED"
                            ? "bg-destructive"
                            : "bg-muted-foreground"
                    )}
                  />
                  <span className="text-foreground">{m.title}</span>
                  <span className="ml-auto text-muted-foreground capitalize">
                    {m.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
          Generated on{" "}
          {now.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · Live data from your plan
        </p>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function ReportsSection({ planId }: { planId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("documents");

  // docs state
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docFilter, setDocFilter] = useState<"all" | "document" | "note">("all");
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Doc | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [noteSaving, setNoteSaving] = useState(false);

  // reports state
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("weekly");
  const [reportType, setReportType] = useState<ReportType>("full");

  // fetch documents on mount
  useEffect(() => {
    if (!planId) return;
    authClient
      .request(`/api/plan/${planId}/documents`, { method: "GET" })
      .then((res) => {
        if (res.data.success) setDocs(res.data.data);
      })
      .catch(console.error)
      .finally(() => setDocsLoading(false));
  }, [planId]);

  const filteredDocs = docs.filter(
    (d) => docFilter === "all" || d.type === docFilter
  );

  async function handleDeleteDoc(id: string) {
    try {
      await authClient.request(`/api/plan/${planId}/documents/${id}`, {
        method: "DELETE",
      });
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  }

  function handleEditNote(doc: Doc) {
    setEditingNote(doc);
    setNoteForm({ title: doc.title, content: doc.content ?? "" });
    setAddNoteOpen(true);
  }

  async function handleNoteSubmit() {
    if (!noteForm.title.trim()) return;
    setNoteSaving(true);
    try {
      if (editingNote) {
        const res = await authClient.request(
          `/api/plan/${planId}/documents/${editingNote.id}`,
          {
            method: "PATCH",
            data: { title: noteForm.title, content: noteForm.content },
          }
        );
        setDocs((prev) =>
          prev.map((d) => (d.id === editingNote.id ? res.data.data : d))
        );
      } else {
        const res = await authClient.request(
          `/api/plan/${planId}/documents`,
          {
            method: "POST",
            data: {
              type: "note",
              title: noteForm.title,
              content: noteForm.content,
            },
          }
        );
        setDocs((prev) => [res.data.data, ...prev]);
      }
      setAddNoteOpen(false);
      setEditingNote(null);
      setNoteForm({ title: "", content: "" });
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setNoteSaving(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: "documents", label: "Documents & Notes", icon: BookOpen },
    { key: "reports", label: "Generated Reports", icon: BarChart3 },
  ];

  return (
    <div className="space-y-5">
      {/* page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage documents, notes, and generate reports for your plan
        </p>
      </div>

      {/* tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── DOCUMENTS & NOTES TAB ── */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          {/* toolbar */}
          <div className="flex items-center justify-between gap-3">
            {/* filter chips */}
            <div className="flex gap-1.5">
              {(["all", "document", "note"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDocFilter(f)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                    docFilter === f
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground bg-background hover:bg-muted"
                  )}
                >
                  {f === "all" ? "All" : f === "document" ? "Documents" : "Notes"}
                </button>
              ))}
            </div>

            {/* actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs"
                onClick={() => {
                  setEditingNote(null);
                  setNoteForm({ title: "", content: "" });
                  setAddNoteOpen(true);
                }}
              >
                <StickyNote className="h-3.5 w-3.5" />
                Add note
              </Button>
            </div>
          </div>

          {/* doc list */}
          {docsLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <File className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  No {docFilter === "all" ? "files" : docFilter + "s"} yet
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add a note to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {filteredDocs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteDoc}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── GENERATED REPORTS TAB ── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {/* config card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <p className="text-sm font-medium text-foreground">Configure report</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose period and type to preview live data
              </p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* period */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Period</Label>
                  <div className="flex gap-1.5">
                    {(["daily", "weekly", "monthly"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setReportPeriod(p)}
                        className={cn(
                          "flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                          reportPeriod === p
                            ? "bg-foreground text-background border-foreground"
                            : "border-border text-muted-foreground bg-background hover:bg-muted"
                        )}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* report type */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Report type</Label>
                  <Select
                    value={reportType}
                    onValueChange={(v) => setReportType(v as ReportType)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(REPORT_TYPE_CONFIG) as [
                          ReportType,
                          (typeof REPORT_TYPE_CONFIG)[ReportType]
                        ][]
                      ).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              {cfg.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    {REPORT_TYPE_CONFIG[reportType].description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* preview */}
          <ReportPreview period={reportPeriod} type={reportType} />
        </div>
      )}

      {/* ── Note dialog ── */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit note" : "Add note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                placeholder="Note title"
                value={noteForm.title}
                onChange={(e) =>
                  setNoteForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                placeholder="Write your note here..."
                value={noteForm.content}
                onChange={(e) =>
                  setNoteForm((f) => ({ ...f, content: e.target.value }))
                }
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setAddNoteOpen(false);
                  setEditingNote(null);
                }}
                disabled={noteSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleNoteSubmit} disabled={noteSaving}>
                {noteSaving ? "Saving..." : editingNote ? "Update note" : "Add note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}