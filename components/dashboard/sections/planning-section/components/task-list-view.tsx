// components/task-list-view.tsx
import { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Circle, Loader2, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CYCLE: Task["status"][] = ["TODO", "IN_PROGRESS", "DONE"];

function nextStatus(s: Task["status"]): Task["status"] {
  return STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length];
}

function StatusIcon({ status }: { status: Task["status"] }) {
  if (status === "DONE")
    return <CheckSquare className="h-4 w-4 text-success shrink-0" />;
  if (status === "IN_PROGRESS")
    return <Loader2 className="h-4 w-4 text-primary shrink-0 animate-spin" />;
  return <Circle className="h-4 w-4 text-muted-foreground shrink-0" />;
}

const STATUS_LABEL: Record<Task["status"], string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const STATUS_BADGE: Record<Task["status"], string> = {
  TODO: "bg-secondary text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  DONE: "bg-success/10 text-success",
};

export function TaskListView({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  onStatusChange: (id: string, status: Task["status"]) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed">
        <CheckSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Add a task to start tracking work in this module
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <div
          key={t.id}
          className="group flex items-start gap-3 rounded-xl border bg-card px-4 py-3 hover:shadow-sm transition"
        >
          {/* Status toggle */}
          <button
            className="mt-0.5 shrink-0 cursor-pointer"
            title={`Status: ${STATUS_LABEL[t.status]} — click to advance`}
            onClick={() => onStatusChange(t.id, nextStatus(t.status))}
          >
            <StatusIcon status={t.status} />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium text-foreground",
              t.status === "DONE" && "line-through text-muted-foreground"
            )}>
              {t.title}
            </p>
            {t.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {t.description}
              </p>
            )}
            <span className={cn(
              "inline-block mt-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
              STATUS_BADGE[t.status]
            )}>
              {STATUS_LABEL[t.status]}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
            <Button size="icon" variant="ghost" onClick={() => onEdit(t)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(t.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}