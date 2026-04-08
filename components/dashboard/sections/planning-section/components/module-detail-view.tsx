// components/module-detail-view.tsx
import { Module } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckSquare } from "lucide-react";

// Placeholder — tasks will plug in here next
export function ModuleDetailView({
  module,
  onBack,
}: {
  module: Module;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Module</p>
          <h2 className="font-semibold text-foreground truncate">{module.name}</h2>
        </div>
      </div>

      {/* Tasks placeholder */}
      <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed">
        <CheckSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Tasks for this module will appear here
        </p>
      </div>
    </div>
  );
}