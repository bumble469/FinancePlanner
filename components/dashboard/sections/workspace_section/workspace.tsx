"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { useFinancialStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  ListTodo,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
} from "lucide-react";
import { useSnackbar } from "@/lib/useSnackbar";

// ─── types ───────────────────────────────────────────────────────────────

type DeptCard = {
  id: string;
  name: string;
  memberCount: number;
  taskStats: { total: number; pending: number; ongoing: number; completed: number };
};

type Assignee = { workItemMemberId: string; name: string | null; image: string | null };
type Reaction = { id: string; emoji: string; authorName: string | null; authorId: string };
type Note = { id: string; body: string; authorName: string | null; createdAt: string };

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  departmentId: string | null;
  phaseId: string | null;
  phaseName: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignees: Assignee[];
  reactions: Reaction[];
  notes: Note[];
};

const EMOJI_OPTIONS = ["👍", "🔥", "✅", "❤️"];

const STATUS_LABEL: Record<TaskItem["status"], string> = {
  TODO: "Pending",
  IN_PROGRESS: "Ongoing",
  DONE: "Completed",
};

const STATUS_BADGE_CLASS: Record<TaskItem["status"], string> = {
  TODO: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DONE: "bg-green-500/10 text-green-600 dark:text-green-400",
};

// ─── main component ──────────────────────────────────────────────────────

export function Workspace({ planId }: { planId: string }) {
  const { currentPlanMeta } = useFinancialStore();
  const { show } = useSnackbar();

  const role = currentPlanMeta?.isOwner ? "OWNER" : (currentPlanMeta?.role ?? "MEMBER");
  const isAdminLevel = role === "OWNER" || role === "ADMIN" || role === "CO_ADMIN";
  const isManager = role === "MANAGER";

  const [departments, setDepartments] = useState<DeptCard[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [selectedDept, setSelectedDept] = useState<DeptCard | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoadingDepts(true);
    try {
      const res = await authClient.request(`/api/plan/${planId}/my-work`);
      setDepartments(res.data.data.departments);
    } catch (err) {
      console.error("Failed to fetch my-work departments:", err);
    } finally {
      setLoadingDepts(false);
    }
  }, [planId]);

  const fetchTasks = useCallback(async (deptId: string) => {
    setLoadingTasks(true);
    try {
      const res = await authClient.request(`/api/plan/${planId}/my-work?departmentId=${deptId}`);
      setTasks(res.data.data.tasks);
    } catch (err) {
      console.error("Failed to fetch my-work tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openDepartment = (dept: DeptCard) => {
    setSelectedDept(dept);
    fetchTasks(dept.id);
  };

  const backToDepartments = () => {
    setSelectedDept(null);
    setTasks([]);
    fetchDepartments(); // stats may have changed while inside
  };

  // Can this user leave notes/reactions on tasks in the currently open department?
  const canAnnotate = isAdminLevel || isManager;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdminLevel
            ? "Track tasks and progress across every department."
            : isManager
              ? "See what your teams are working on."
              : "See what's assigned to you."}
        </p>
      </div>

      {!selectedDept ? (
        <DepartmentGrid departments={departments} loading={loadingDepts} onOpen={openDepartment} />
      ) : (
        <DepartmentDetail
          dept={selectedDept}
          tasks={tasks}
          loading={loadingTasks}
          onBack={backToDepartments}
          planId={planId}
          role={role}
          canAnnotate={canAnnotate}
          isMember={role === "MEMBER"}
          onTaskUpdated={(updated) =>
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
          }
          show={show}
        />
      )}
    </div>
  );
}

// ─── Department grid ─────────────────────────────────────────────────────

function DepartmentGrid({
  departments,
  loading,
  onOpen,
}: {
  departments: DeptCard[];
  loading: boolean;
  onOpen: (d: DeptCard) => void;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading departments...</p>;
  }

  if (departments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No departments to show yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept) => (
        <div key={dept.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{dept.name}</h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {dept.memberCount}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/40 py-2">
              <p className="text-lg font-bold text-foreground">{dept.taskStats.pending}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
            <div className="rounded-lg bg-muted/40 py-2">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{dept.taskStats.ongoing}</p>
              <p className="text-[10px] text-muted-foreground">Ongoing</p>
            </div>
            <div className="rounded-lg bg-muted/40 py-2">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{dept.taskStats.completed}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
          </div>

          <Button size="sm" variant="outline" className="w-full cursor-pointer hover:text-gray-600" onClick={() => onOpen(dept)}>
            Open
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─── Department detail ───────────────────────────────────────────────────

function DepartmentDetail({
  dept,
  tasks,
  loading,
  onBack,
  planId,
  role,
  canAnnotate,
  isMember,
  onTaskUpdated,
  show,
}: {
  dept: DeptCard;
  tasks: TaskItem[];
  loading: boolean;
  onBack: () => void;
  planId: string;
  role: string;
  canAnnotate: boolean;
  isMember: boolean;
  onTaskUpdated: (task: TaskItem) => void;
  show: (msg: string, type?: "success" | "error") => void;
}) {
  const [statusChangeFor, setStatusChangeFor] = useState<{ task: TaskItem; newStatus: TaskItem["status"] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmStatusChange = async () => {
    if (!statusChangeFor) return;
    setSubmitting(true);
    try {
      const res = await authClient.request(
        `/api/plan/${planId}/departments/${dept.id}/tasks/${statusChangeFor.task.id}`,
        { method: "PATCH", data: { status: statusChangeFor.newStatus } }
      );
      onTaskUpdated({ ...statusChangeFor.task, status: res.data.status, completedAt: res.data.completedAt ?? null });
      show("Task updated", "success");
      setStatusChangeFor(null);
    } catch (err) {
      console.error("Failed to update task status:", err);
      show("Failed to update task", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to departments
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{dept.name}</h2>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ListTodo className="h-3.5 w-3.5" /> {dept.taskStats.pending} pending</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {dept.taskStats.ongoing} ongoing</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {dept.taskStats.completed} completed</span>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          {isMember ? "No tasks assigned to you here yet." : "No tasks in this department yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              planId={planId}
              deptId={dept.id}
              canAnnotate={canAnnotate}
              isMember={isMember}
              onRequestStatusChange={(newStatus) => setStatusChangeFor({ task, newStatus })}
              onTaskUpdated={onTaskUpdated}
              show={show}
            />
          ))}
        </div>
      )}

      <Dialog open={!!statusChangeFor} onOpenChange={(open) => { if (!open) setStatusChangeFor(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update task status</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Mark <span className="font-medium text-foreground">"{statusChangeFor?.task.title}"</span> as{" "}
            <span className="font-medium text-foreground">
              {statusChangeFor && STATUS_LABEL[statusChangeFor.newStatus]}
            </span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeFor(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmStatusChange} disabled={submitting}>
              {submitting ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Task card ───────────────────────────────────────────────────────────

function TaskCard({
  task,
  planId,
  deptId,
  canAnnotate,
  isMember,
  onRequestStatusChange,
  onTaskUpdated,
  show,
}: {
  task: TaskItem;
  planId: string;
  deptId: string;
  canAnnotate: boolean;
  isMember: boolean;
  onRequestStatusChange: (status: TaskItem["status"]) => void;
  onTaskUpdated: (task: TaskItem) => void;
  show: (msg: string, type?: "success" | "error") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await authClient.request(`/api/plan/${planId}/my-work/tasks/${task.id}/notes`, {
        method: "POST",
        data: { body: noteText.trim() },
      });
      onTaskUpdated({ ...task, notes: [res.data.data, ...task.notes] });
      setNoteText("");
      show("Note added", "success");
    } catch (err) {
      console.error("Failed to add note:", err);
      show("Failed to add note", "error");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleReact = async (emoji: string) => {
    try {
      const res = await authClient.request(`/api/plan/${planId}/my-work/tasks/${task.id}/reactions`, {
        method: "PUT",
        data: { emoji },
      });
      const withoutMine = task.reactions.filter((r) => r.authorId !== res.data.data.authorId);
      onTaskUpdated({ ...task, reactions: [...withoutMine, res.data.data] });
    } catch (err) {
      console.error("Failed to react:", err);
      show("Failed to react", "error");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_BADGE_CLASS[task.status])}>
              {STATUS_LABEL[task.status]}
            </span>
            {task.phaseName && (
              <span className="text-xs text-muted-foreground">Phase: {task.phaseName}</span>
            )}
            {!isMember && task.assignees.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Assigned: {task.assignees.map((a) => a.name ?? "Unnamed").join(", ")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex gap-1">
            {task.status !== "IN_PROGRESS" && task.status !== "DONE" && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onRequestStatusChange("IN_PROGRESS")}>
                Start
              </Button>
            )}
            {task.status !== "DONE" && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-600 hover:text-green-700" onClick={() => onRequestStatusChange("DONE")}>
                Mark done
              </Button>
            )}
          </div>
          {canAnnotate && (
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {task.notes.length > 0 ? `${task.notes.length} note${task.notes.length > 1 ? "s" : ""}` : "Notes"}
            </Button>
          )}
        </div>
      </div>

      {/* reactions row — visible to everyone, editable only by those who can annotate */}
      {(task.reactions.length > 0 || canAnnotate) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.reactions.map((r) => (
            <span key={r.id} title={r.authorName ?? ""} className="rounded-full bg-muted/50 px-2 py-0.5 text-xs">
              {r.emoji}
            </span>
          ))}
          {canAnnotate && (
            <div className="flex gap-0.5 ml-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="rounded-full px-1.5 py-0.5 text-sm hover:bg-muted/60 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {expanded && canAnnotate && (
        <div className="space-y-2 pt-2 border-t border-border">
          {task.notes.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {task.notes.map((n) => (
                <div key={n.id} className="rounded-lg bg-muted/30 px-3 py-1.5 text-xs">
                  <p className="text-foreground">{n.body}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {n.authorName ?? "Unknown"} · {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Leave a note..."
              rows={1}
              className="resize-none text-xs"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" disabled={submittingNote || !noteText.trim()} onClick={handleAddNote}>
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}