"use client";

import { useState } from "react";
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
  ChevronDown,
  Clock,
  BookOpen,
  TrendingUp,
  CheckSquare,
  Layers,
  FileDown,
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

// ─── types ───────────────────────────────────────────────────────────────────

type Tab = "documents" | "reports";
type DocType = "document" | "note";
type ReportPeriod = "daily" | "weekly" | "monthly";
type ReportType = "financial" | "activity" | "full";

interface Doc {
  id: string;
  type: DocType;
  title: string;
  content?: string;       // for notes
  fileName?: string;      // for documents
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string;
}

// ─── mock data ────────────────────────────────────────────────────────────────

const MOCK_DOCS: Doc[] = [
  { id: "1", type: "document", title: "Project Brief", fileName: "project-brief.pdf", fileSize: "2.4 MB", uploadedAt: "2026-05-01", uploadedBy: "Aryan" },
  { id: "2", type: "document", title: "Venue Contract", fileName: "venue-contract.pdf", fileSize: "1.1 MB", uploadedAt: "2026-04-28", uploadedBy: "Priya" },
  { id: "3", type: "note", title: "Sponsor meeting notes", content: "Discussed branding placement. They want logo on stage backdrop and entry banners. Follow up by Friday.", uploadedAt: "2026-05-03", uploadedBy: "Aryan" },
  { id: "4", type: "note", title: "Catering checklist", content: "Confirm veg/non-veg ratio. Check allergy requirements. Get quote from 2 more vendors before finalizing.", uploadedAt: "2026-05-04", uploadedBy: "Rahul" },
];

const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; icon: typeof TrendingUp; description: string }> = {
  financial: { label: "Financial Report",  icon: TrendingUp,   description: "Income, expenses, P&L, budget utilization" },
  activity:  { label: "Activity Report",   icon: CheckSquare,  description: "Tasks completed, milestones hit, team activity" },
  full:      { label: "Full Report",       icon: Layers,       description: "Complete overview — finances, work done, team, milestones" },
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  daily: "Today",
  weekly: "This week",
  monthly: "This month",
};

// ─── sub-components ──────────────────────────────────────────────────────────

function DocCard({ doc, onEdit, onDelete }: { doc: Doc; onEdit: (d: Doc) => void; onDelete: (id: string) => void }) {
  const isNote = doc.type === "note";
  return (
    <div className={cn(
      "group relative rounded-xl border border-border bg-card p-4 flex gap-3 hover:border-foreground/20 hover:shadow-sm transition-all",
    )}>
      {/* icon */}
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        isNote ? "bg-yellow-500/10" : "bg-blue-500/10"
      )}>
        {isNote
          ? <StickyNote className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          : <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        }
      </div>

      {/* content */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-foreground truncate">{doc.title}</p>
        {isNote
          ? <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.content}</p>
          : <p className="text-xs text-muted-foreground mt-0.5">{doc.fileName} · {doc.fileSize}</p>
        }
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {doc.uploadedBy}
        </p>
      </div>

      {/* actions — visible on hover */}
      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isNote && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(doc)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {!isNote && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {}}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(doc.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── report preview ──────────────────────────────────────────────────────────

function ReportPreview({ period, type }: { period: ReportPeriod; type: ReportType }) {
  const cfg = REPORT_TYPE_CONFIG[type];
  const Icon = cfg.icon;

  // mock summary numbers
  const financialData = [
    { label: "Total Income",   value: "₹4,20,000", positive: true },
    { label: "Total Expenses", value: "₹2,85,000", positive: false },
    { label: "Net P&L",        value: "+₹1,35,000", positive: true },
    { label: "Budget Used",    value: "71%",         positive: null },
  ];

  const activityData = [
    { label: "Tasks Completed", value: "12" },
    { label: "Tasks In Progress", value: "5" },
    { label: "Milestones Achieved", value: "2" },
    { label: "Team Members Active", value: "8" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* preview header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{cfg.label}</p>
            <p className="text-xs text-muted-foreground">{PERIOD_LABELS[period]}</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 h-8 text-xs">
          <FileDown className="h-3.5 w-3.5" />
          Download PDF
        </Button>
      </div>

      {/* preview body */}
      <div className="p-5 space-y-5">
        {/* period badge */}
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {period === "daily"   && new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {period === "weekly"  && "Week of " + new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {period === "monthly" && new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </span>
        </div>

        {/* financial section */}
        {(type === "financial" || type === "full") && (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Financials</p>
            <div className="grid grid-cols-2 gap-2">
              {financialData.map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className={cn(
                    "text-sm font-semibold mt-0.5 font-mono",
                    item.positive === true  ? "text-green-600 dark:text-green-400" :
                    item.positive === false ? "text-destructive" : "text-foreground"
                  )}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* activity section */}
        {(type === "activity" || type === "full") && (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activity</p>
            <div className="grid grid-cols-2 gap-2">
              {activityData.map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold mt-0.5 text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* full report extra */}
        {type === "full" && (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Milestones</p>
            <div className="space-y-1.5">
              {["Venue confirmed", "Sponsor deck finalized"].map((m) => (
                <div key={m} className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  <span className="text-foreground">{m}</span>
                  <span className="ml-auto text-muted-foreground">Achieved</span>
                </div>
              ))}
              {["Marketing push"].map((m) => (
                <div key={m} className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                  <span className="text-foreground">{m}</span>
                  <span className="ml-auto text-muted-foreground">In Progress</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
          Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · Data is live from your plan
        </p>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function ReportsSection() {
  const [activeTab, setActiveTab] = useState<Tab>("documents");

  // docs state
  const [docs, setDocs] = useState<Doc[]>(MOCK_DOCS);
  const [docFilter, setDocFilter] = useState<"all" | "document" | "note">("all");
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Doc | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });

  // reports state
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("weekly");
  const [reportType, setReportType] = useState<ReportType>("full");

  const filteredDocs = docs.filter((d) => docFilter === "all" || d.type === docFilter);

  function handleDeleteDoc(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function handleEditNote(doc: Doc) {
    setEditingNote(doc);
    setNoteForm({ title: doc.title, content: doc.content ?? "" });
    setAddNoteOpen(true);
  }

  function handleNoteSubmit() {
    if (!noteForm.title.trim()) return;
    if (editingNote) {
      setDocs((prev) => prev.map((d) =>
        d.id === editingNote.id ? { ...d, title: noteForm.title, content: noteForm.content } : d
      ));
    } else {
      setDocs((prev) => [...prev, {
        id: crypto.randomUUID(),
        type: "note",
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        uploadedAt: new Date().toISOString().split("T")[0],
        uploadedBy: "You",
      }]);
    }
    setAddNoteOpen(false);
    setEditingNote(null);
    setNoteForm({ title: "", content: "" });
  }

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: "documents", label: "Documents & Notes", icon: BookOpen },
    { key: "reports",   label: "Generated Reports",  icon: BarChart3 },
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
                onClick={() => { setEditingNote(null); setNoteForm({ title: "", content: "" }); setAddNoteOpen(true); }}
              >
                <StickyNote className="h-3.5 w-3.5" />
                Add note
              </Button>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Upload file
              </Button>
            </div>
          </div>

          {/* doc list */}
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <File className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">No {docFilter === "all" ? "files" : docFilter + "s"} yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Upload a document or add a note to get started</p>
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
          {/* report config card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <p className="text-sm font-medium text-foreground">Configure report</p>
              <p className="text-xs text-muted-foreground mt-0.5">Choose period and type to preview and download</p>
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
                  <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(REPORT_TYPE_CONFIG) as [ReportType, typeof REPORT_TYPE_CONFIG[ReportType]][]).map(([key, cfg]) => {
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
                  <p className="text-[10px] text-muted-foreground">{REPORT_TYPE_CONFIG[reportType].description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* report preview */}
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
                onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                placeholder="Write your note here..."
                value={noteForm.content}
                onChange={(e) => setNoteForm((f) => ({ ...f, content: e.target.value }))}
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setAddNoteOpen(false); setEditingNote(null); }}>Cancel</Button>
              <Button onClick={handleNoteSubmit}>{editingNote ? "Update" : "Add"} note</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}