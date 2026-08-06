"use client";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useFinancialStore } from "@/lib/store";
import { useSnackbar } from "@/lib/useSnackbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";
import {
  Wrench, Plus, Trash2, Clock, CheckCircle2, XCircle, PackageCheck,
  AlertTriangle, ShoppingBag, RotateCcw, HelpCircle,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { RequestHardwareDialog } from "./components/request-hardware-dialog";
import { ReviewHardwareDialog } from "./components/review-hardware-dialog";
import type { PlanPermissions } from "@/lib/permissions";
import type { HardwareItem, HardwareCondition, HardwareRequestStatus } from "@/lib/types";

function fmt(value: number, currency: string) {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${value.toLocaleString("en-IN")}`;
}

const CONDITION_CONFIG: Record<HardwareCondition, { label: string; icon: typeof PackageCheck; className: string }> = {
  WORKING: { label: "Working", icon: PackageCheck, className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  IN_USE: { label: "In use", icon: Wrench, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  BROKEN_DOWN: { label: "Broken down", icon: AlertTriangle, className: "bg-destructive/10 text-destructive" },
  PURCHASED: { label: "Purchased", icon: ShoppingBag, className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  RETURNED: { label: "Returned", icon: RotateCcw, className: "bg-muted text-muted-foreground" },
  LOST: { label: "Lost", icon: HelpCircle, className: "bg-destructive/10 text-destructive" },
};

const STATUS_FILTERS: { key: HardwareRequestStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "DECLINED", label: "Declined" },
];

function HardwareCard({
  item, currency, canManage, canApprove, canDelete,
  onReview, onDelete, onConditionChange,
}: {
  item: HardwareItem;
  currency: string;
  canManage: boolean;
  canApprove: boolean;
  canDelete: boolean;
  onReview: (item: HardwareItem) => void;
  onDelete: (id: string) => void;
  onConditionChange: (id: string, condition: HardwareCondition) => void;
}) {
  const condCfg = item.condition ? CONDITION_CONFIG[item.condition] : null;
  const CondIcon = condCfg?.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.quantity}x {item.category.toLowerCase()} · {item.source.toLowerCase()}
            {item.vendor && ` · ${item.vendor}`}
            {item.department && ` · ${item.department.name}`}
            {item.stall && ` · ${item.stall.name}`}
          </p>
        </div>
        {canDelete && (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive cursor-pointer shrink-0" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {item.requestStatus === "PENDING" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 text-xs font-medium">
            <Clock className="h-3 w-3" /> Pending approval
          </span>
        )}
        {item.requestStatus === "DECLINED" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-medium" title={item.declineReason ?? undefined}>
            <XCircle className="h-3 w-3" /> Declined
          </span>
        )}
        {item.requestStatus === "APPROVED" && condCfg && CondIcon && (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", condCfg.className)}>
            <CondIcon className="h-3 w-3" /> {condCfg.label}
          </span>
        )}
        {item.source === "RENTED" && item.monthlyRentAmount != null && item.requestStatus === "APPROVED" && (
          <span className="text-xs text-muted-foreground">
            {fmt(item.monthlyRentAmount, currency)}/mo
            {item.rentalEnd && ` · due back ${new Date(item.rentalEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
          </span>
        )}
      </div>

      {item.requestStatus === "DECLINED" && item.declineReason && (
        <p className="text-xs text-muted-foreground italic">"{item.declineReason}"</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          Requested by {item.requestedBy?.user?.name ?? "Unknown"}
        </p>

        {item.requestStatus === "PENDING" && canApprove && (
          <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => onReview(item)}>
            Review
          </Button>
        )}

        {item.requestStatus === "APPROVED" && canManage && (
          <Select value={item.condition ?? undefined} onValueChange={(v) => onConditionChange(item.id, v as HardwareCondition)}>
            <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Set condition" /></SelectTrigger>
            <SelectContent>
              {(Object.keys(CONDITION_CONFIG) as HardwareCondition[]).map((c) => (
                <SelectItem key={c} value={c}>{CONDITION_CONFIG[c].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

export function HardwareSection({ planId, permissions }: { planId: string; permissions: PlanPermissions }) {
  const { currency, departments, currentPlanMeta } = useFinancialStore();
  const { show } = useSnackbar();
  const isEvent = currentPlanMeta?.type === "event";

  const [items, setItems] = useState<HardwareItem[]>([]);
  const [stalls, setStalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HardwareRequestStatus | "ALL">("ALL");

  const [requestOpen, setRequestOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<HardwareItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const calls: Promise<any>[] = [authClient.request(`/api/plan/${planId}/hardware`)];
      if (isEvent && currentPlanMeta?.hasStalls) {
        calls.push(authClient.request(`/api/plan/${planId}/stalls`));
      }
      const [hwRes, stallsRes] = await Promise.all(calls);
      setItems(hwRes.data.data ?? []);
      if (stallsRes) setStalls(stallsRes.data.data ?? []);
    } catch (err) {
      console.error("Fetch hardware failed:", err);
      show("Failed to fetch hardware", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [planId]);

  const handleRequest = async (data: any) => {
    await authClient.request(`/api/plan/${planId}/hardware`, { method: "POST", data });
    show("Hardware request submitted", "success");
    fetchAll();
  };

  const handleReview = async (action: "approve" | "decline", reason?: string) => {
    if (!reviewingItem) return;
    await authClient.request(`/api/plan/${planId}/hardware/${reviewingItem.id}/review`, {
      method: "PATCH",
      data: { action, reason },
    });
    show(action === "approve" ? "Request approved" : "Request declined", "success");
    fetchAll();
  };

  const handleConditionChange = async (id: string, condition: HardwareCondition) => {
    try {
      await authClient.request(`/api/plan/${planId}/hardware/${id}/condition`, { method: "PATCH", data: { condition } });
      show("Condition updated", "success");
      fetchAll();
    } catch (err: any) {
      show(err?.response?.data?.error || "Failed to update condition", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await authClient.request(`/api/plan/${planId}/hardware/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      show("Hardware item deleted", "success");
    } catch (err: any) {
      show(err?.response?.data?.error || "Failed to delete", "error");
    }
  };

  const filtered = filter === "ALL" ? items : items.filter((i) => i.requestStatus === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Hardware Logistics</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Equipment requests, rentals, and inventory condition</p>
        </div>
        {permissions.canRequestHardware && (
          <Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => setRequestOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Request hardware
          </Button>
        )}
      </div>

      <div className="flex gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              filter === f.key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Wrench className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No hardware items</p>
            <p className="text-xs text-muted-foreground mt-0.5">Request equipment to start tracking it here</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <HardwareCard
              key={item.id}
              item={item}
              currency={currency}
              canManage={permissions.canManageHardware(item.departmentId)}
              canApprove={permissions.canApproveHardwareRequest(item.departmentId)}
              canDelete={permissions.canDeleteHardware}
              onReview={setReviewingItem}
              onDelete={(id) => { setDeleteId(id); setConfirmOpen(true); }}
              onConditionChange={handleConditionChange}
            />
          ))}
        </div>
      )}

      <RequestHardwareDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        departments={departments}
        stalls={stalls}
        isEvent={isEvent}
        onSave={handleRequest}
      />

      <ReviewHardwareDialog
        open={!!reviewingItem}
        onOpenChange={(v) => { if (!v) setReviewingItem(null); }}
        item={reviewingItem}
        onReview={handleReview}
      />

      <ConfirmDeleteDialog
        open={confirmOpen}
        type="hardware item"
        setOpen={setConfirmOpen}
        onConfirm={() => { if (deleteId) { handleDelete(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}