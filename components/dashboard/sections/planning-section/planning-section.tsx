"use client";
import { useState, useEffect } from "react";
import { useFinancialStore } from "@/lib/store";
import { authClient } from "@/lib/auth-client";
import { Department, Milestone, MilestoneStatus, MilestoneTask, MilestoneFormData } from "@/lib/types";
import { Flag, Plus, CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddDeptDialog } from "./components/add-dept-dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { DepartmentListView } from "./components/dept-list-view";
import { DepartmentDetailView } from "./components/dept-detail-view";
import { MilestoneDialog } from "./components/milestones-dialog";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useSnackbar } from "@/lib/useSnackbar";

const STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; icon: typeof Circle; className: string; badgeClass: string }
> = {
  UPCOMING: { label: "Upcoming", icon: Circle, className: "text-muted-foreground", badgeClass: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "In Progress", icon: Clock, className: "text-yellow-600 dark:text-yellow-400", badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  ACHIEVED: { label: "Achieved", icon: CheckCircle2, className: "text-green-600 dark:text-green-400", badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400" },
  MISSED: { label: "Missed", icon: AlertTriangle, className: "text-destructive", badgeClass: "bg-destructive/10 text-destructive" },
};

function getMilestoneProgress(tasks: MilestoneTask[]) {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.status === "DONE").length / tasks.length) * 100);
}

function MilestoneCard({
  milestone,
  onEdit,
  onDelete,
}: {
  milestone: Milestone;
  onEdit: (m: Milestone) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[milestone.status];
  const StatusIcon = cfg.icon;
  const progress = getMilestoneProgress(milestone.tasks);
  const doneTasks = milestone.tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <StatusIcon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.className)} />
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{milestone.title}</p>
            {milestone.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{milestone.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 cursor-pointer" onClick={() => onEdit(milestone)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive cursor-pointer" onClick={() => onDelete(milestone.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cfg.badgeClass)}>
          {cfg.label}
        </span>
        {milestone.dueDate && (
          <span className="text-xs text-muted-foreground">
            Due {new Date(milestone.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      {/* Task progress */}
      {milestone.tasks.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tasks</span>
            <span>{doneTasks}/{milestone.tasks.length} done</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progress === 100 ? "bg-green-500" : progress > 0 ? "bg-yellow-500" : "bg-muted-foreground/30"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-col gap-1 pt-1">
            {milestone.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-xs">
                {task.status === "DONE" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                ) : task.status === "IN_PROGRESS" ? (
                  <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400 shrink-0" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span className={cn(
                  task.status === "DONE" ? "line-through text-muted-foreground" : "text-foreground"
                )}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No tasks found</p>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PlanningSection() {
  const {
    currentPlanId, mode, eventData, expenses, simulation,
    departments, addDepartment, updateDepartment, removeDepartment,
    modules, addModule, updateModule, removeModule, currency, tasks, milestones, addMilestone, updateMilestone, removeMilestone,
  } = useFinancialStore();

  const isProject = mode === "project";

  // dept state
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null);
  const [confirmDeptOpen, setConfirmDeptOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<Department | null>(null);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [confirmModuleOpen, setConfirmModuleOpen] = useState(false);

  // milestone state
  const [milestoneFilter, setMilestoneFilter] = useState<MilestoneStatus | "ALL">("ALL");
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(null);
  const [confirmMilestoneOpen, setConfirmMilestoneOpen] = useState(false);

  const remainingBudget = (eventData.eventBudget || 0) - departments
    .filter((d) => d.id !== editingDept?.id)
    .reduce((sum, d) => sum + Number(d.budget || 0), 0);

  // ── dept effects & handlers ──────────────────────────────────────────────

  useEffect(() => { fetchDepartments(); }, [currentPlanId]);
  useEffect(() => { if (activeDept) fetchPhases(activeDept.id); }, [activeDept]);
  useEffect(() => { fetchMilestones(); }, [currentPlanId]);

  const { show } = useSnackbar();

  const fetchDepartments = async () => {
    if (!currentPlanId) return;
    try {
      const res = await authClient.request(`/api/plan/${currentPlanId}/departments`);
      useFinancialStore.getState().setDepartments(
        res.data.map((d: any) => ({ ...d, budget: Number(d.budget) }))
      );
    } catch (err) {
      console.error("Fetch departments failed:", err);
      show("Failed to fetch departments", "error");
    }
  };

  const createDepartment = async (id: string, name: string, budget: number) => {
    if (!currentPlanId) return;
    addDepartment({ id, name, budget });
    try {
      await authClient.request(`/api/plan/${currentPlanId}/departments`, { method: "POST", data: { name, budget } });
      show("Department created", "success");
    } catch (err) {
      console.error("Create department failed:", err);
      removeDepartment(id);
      show("Failed to create department", "error");
    }
  };

  const updateDepartmentHandler = async (id: string, data: Partial<{ name: string; budget: number }>) => {
    if (!currentPlanId) return;
    updateDepartment(id, data);
    try {
      await authClient.request(`/api/plan/${currentPlanId}/departments/${id}`, { method: "PATCH", data });
      show("Department updated", "success");
    } catch (err) {
      console.error("Update failed:", err);
      show("Failed to update department", "error");
    }
  };

  const deleteDepartmentHandler = async (id: string) => {
    if (!currentPlanId) return;
    removeDepartment(id);
    try {
      await authClient.request(`/api/plan/${currentPlanId}/departments/${id}`, { method: "DELETE" });
      show("Department deleted", "success");
    } catch (err) {
      console.error("Delete failed:", err);
      show("Failed to delete department", "error");
    }
  };

  const fetchPhases = async (deptId: string) => {
    if (!currentPlanId) return;
    try {
      const res = await authClient.request(`/api/plan/${currentPlanId}/departments/${deptId}/phases`);
      useFinancialStore.getState().setModules(res.data.map((p: any) => ({ ...p })));
    } catch (err) {
      console.error("Fetch phases failed:", err);
      show("Failed to fetch phases", "error");
    }
  };

  const createPhase = async (deptId: string, name: string) => {
    if (!currentPlanId) return;
    const tempId = crypto.randomUUID();
    addModule({ id: tempId, name, departmentId: deptId });
    try {
      const res = await authClient.request(`/api/plan/${currentPlanId}/departments/${deptId}/phases`, { method: "POST", data: { name } });
      useFinancialStore.getState().updateModule(tempId, res.data.id);
      show("Phase created", "success");
    } catch (err) {
      console.error("Create phase failed:", err);
      removeModule(tempId);
      show("Failed to create phase", "error");
    }
  };

  const updatePhaseHandler = async (deptId: string, phaseId: string, data: Partial<{ name: string; startDate: string; endDate: string }>) => {
    if (!currentPlanId) return;
    updateModule(phaseId, data);
    try {
      await authClient.request(`/api/plan/${currentPlanId}/departments/${deptId}/phases/${phaseId}`, { method: "PATCH", data });
      show("Phase updated", "success");
    } catch (err) {
      console.error("Update phase failed:", err);
      show("Failed to update phase", "error");
    }
  };

  const deletePhaseHandler = async (phaseId: string) => {
    if (!currentPlanId || !activeDept) return;
    removeModule(phaseId);
    try {
      await authClient.request(`/api/plan/${currentPlanId}/departments/${activeDept.id}/phases/${phaseId}`, { method: "DELETE" });
      show("Phase deleted", "success");
    } catch (err) {
      console.error("Delete phase failed:", err);
      show("Failed to delete phase", "error");
    }
  };

  const fetchMilestones = async () => {
    if (!currentPlanId) return;
    try {
      const res = await authClient.request(`/api/plan/${currentPlanId}/milestones`);
      useFinancialStore.getState().setMilestones(res.data ?? []);
    } catch (err) {
      console.error("Fetch milestones failed:", err);
      show("Failed to fetch milestones", "error");
    }
  };

  const createMilestone = async (data: MilestoneFormData) => {
    if (!currentPlanId) return;
    const tempId = crypto.randomUUID();
    const optimistic: Milestone = {
      id: tempId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      status: data.status,
      tasks: tasks
        .filter((t) => data.taskIds.includes(t.id))
        .map((t) => ({ id: t.id, title: t.title, status: t.status })),
    };
    addMilestone(optimistic);
    try {
      const res = await authClient.request(`/api/plan/${currentPlanId}/milestones`, {
        method: "POST",
        data: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          status: data.status,
          departmentId: data.departmentId,
          phaseId: data.phaseId,
          taskIds: data.taskIds,
        },
      });
      useFinancialStore.getState().updateMilestone(tempId, res.data);
      show("Milestone created", "success");
    } catch (err) {
      console.error("Create milestone failed:", err);
      removeMilestone(tempId);
      show("Failed to create milestone", "error");
    }
  };

  const updateMilestoneHandler = async (id: string, data: MilestoneFormData) => {
    if (!currentPlanId) return;
    updateMilestone(id, {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      status: data.status,
      tasks: tasks
        .filter((t) => data.taskIds.includes(t.id))
        .map((t) => ({ id: t.id, title: t.title, status: t.status })),
    });
    try {
      await authClient.request(`/api/plan/${currentPlanId}/milestones/${id}`, {
        method: "PATCH",
        data: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          status: data.status,
          departmentId: data.departmentId,
          phaseId: data.phaseId,
          taskIds: data.taskIds,
        },
      });
      show("Milestone updated", "success");
    } catch (err) {
      console.error("Update milestone failed:", err);
      fetchMilestones();
      show("Failed to update milestone", "error");
    }
  };

  const deleteMilestoneHandler = async (id: string) => {
    removeMilestone(id);
    try {
      await authClient.request(`/api/plan/${currentPlanId}/milestones/${id}`, { method: "DELETE" });
      show("Milestone deleted", "success");
    } catch (err) {
      console.error("Delete milestone failed:", err);
      fetchMilestones();
      show("Failed to delete milestone", "error");
    }
  };

  const filteredMilestones = milestones.filter(
    (m) => milestoneFilter === "ALL" || m.status === milestoneFilter
  );

  const milestoneCounts = {
    UPCOMING: milestones.filter((m) => m.status === "UPCOMING").length,
    IN_PROGRESS: milestones.filter((m) => m.status === "IN_PROGRESS").length,
    ACHIEVED: milestones.filter((m) => m.status === "ACHIEVED").length,
    MISSED: milestones.filter((m) => m.status === "MISSED").length,
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Planning</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Departments, phases, tasks and milestones
          </p>
        </div>
      </div>

      {/* ── Departments block ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* block header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background border border-border">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="font-medium text-sm text-foreground">Departments</span>
            {!activeDept && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
                {departments.length}
              </span>
            )}
          </div>

          {!activeDept && (
            <div className="flex items-center gap-2">
              <AddDeptDialog
                onCreate={createDepartment}
                onUpdate={(id, name, budget) => updateDepartmentHandler(id, { name, budget })}
                onDeptCreated={fetchDepartments}
                maxBudget={remainingBudget}
                editingDept={editingDept}
                open={deptDialogOpen}
                setOpen={(v) => { setDeptDialogOpen(v); if (!v) setEditingDept(null); }}
              />
              <ConfirmDeleteDialog
                open={confirmDeptOpen}
                type="department"
                setOpen={setConfirmDeptOpen}
                onConfirm={() => {
                  if (deleteDeptId) { deleteDepartmentHandler(deleteDeptId); setDeleteDeptId(null); }
                }}
              />
            </div>
          )}

          {/* module confirm delete — always mounted */}
          <ConfirmDeleteDialog
            open={confirmModuleOpen}
            type="module"
            setOpen={setConfirmModuleOpen}
            onConfirm={() => {
              if (deleteModuleId) { deletePhaseHandler(deleteModuleId); setDeleteModuleId(null); }
            }}
          />
        </div>

        {/* block body */}
        <div className="p-6">
          {activeDept ? (
            <DepartmentDetailView
              dept={activeDept}
              modules={modules}
              currency={currency}
              onBack={() => setActiveDept(null)}
              onAddModule={(name) => createPhase(activeDept.id, name)}
              onEditModule={(module, name) => updatePhaseHandler(activeDept.id, module.id, { name })}
              onDeleteModule={(id) => { setDeleteModuleId(id); setConfirmModuleOpen(true); }}
            />
          ) : (
            <DepartmentListView
              departments={departments}
              currency={currency}
              isProject={isProject}
              onEdit={(d) => { setEditingDept(d); setDeptDialogOpen(true); }}
              onDelete={(id) => { setDeleteDeptId(id); setConfirmDeptOpen(true); }}
              onDrillDown={(d) => setActiveDept(d)}
            />
          )}
        </div>
      </div>

      {/* ── Milestones block ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* block header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background border border-border">
              <Flag className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="font-medium text-sm text-foreground">Milestones</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
              {milestones.length}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs font-medium hover:text-gray-400 cursor-pointer"
            onClick={() => { setEditingMilestone(null); setMilestoneDialogOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add milestone
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {/* status filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "UPCOMING", "IN_PROGRESS", "ACHIEVED", "MISSED"] as const).map((f) => {
              const count = f === "ALL" ? milestones.length : milestoneCounts[f];
              return (
                <button
                  key={f}
                  onClick={() => setMilestoneFilter(f)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-all inline-flex items-center gap-1.5",
                    milestoneFilter === f
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "border-border text-muted-foreground bg-background hover:bg-muted hover:text-foreground"
                  )}
                >
                  {f === "ALL" ? "All" : STATUS_CONFIG[f].label}
                  <span className={cn(
                    "rounded-full min-w-[18px] text-center px-1 py-0.5 text-[10px] font-semibold",
                    milestoneFilter === f
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* milestone grid */}
          {filteredMilestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Flag className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No milestones</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {milestoneFilter === "ALL"
                    ? "Create your first milestone to track progress"
                    : `No ${STATUS_CONFIG[milestoneFilter as keyof typeof STATUS_CONFIG]?.label.toLowerCase()} milestones`}
                </p>
              </div>
              {milestoneFilter === "ALL" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs mt-1"
                  onClick={() => { setEditingMilestone(null); setMilestoneDialogOpen(true); }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add milestone
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onEdit={(m) => { setEditingMilestone(m); setMilestoneDialogOpen(true); }}
                  onDelete={(id) => { setDeleteMilestoneId(id); setConfirmMilestoneOpen(true); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}
      <ConfirmDeleteDialog
        open={confirmMilestoneOpen}
        type="milestone"
        setOpen={setConfirmMilestoneOpen}
        onConfirm={() => {
          if (deleteMilestoneId) { deleteMilestoneHandler(deleteMilestoneId); setDeleteMilestoneId(null); }
        }}
      />

      <MilestoneDialog
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        editing={editingMilestone}
        departments={departments}
        availableTasks={tasks}
        onCreate={createMilestone}
        onUpdate={updateMilestoneHandler}
        onClose={() => {
          setMilestoneDialogOpen(false);
          setEditingMilestone(null);
        }}
      />
    </div>
  );
}