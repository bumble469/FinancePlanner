"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { useSnackbar } from "@/lib/useSnackbar";
import { Search, X } from "lucide-react";

type ExtensionRequest = {
  id: string;
  targetType: "TASK" | "MILESTONE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedDueDate: string;
  currentDueDate: string | null;
  reason: string | null;
  createdAt: string;
  applyMode?: string | null;
  requestedBy: { user: { name: string | null; email: string } };
  task?: { title: string } | null;
  milestone?: { title: string } | null;
};

function StatusBadge({ status }: { status: ExtensionRequest["status"] }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${
        status === "PENDING"
          ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
          : status === "APPROVED"
            ? "bg-green-500/10 text-green-600 dark:text-green-400"
            : "bg-red-500/10 text-red-600 dark:text-red-400"
      }`}
    >
      {status}
    </span>
  );
}

function RequestCard({
  req,
  canApprove,
  submittingId,
  onReview,
}: {
  req: ExtensionRequest;
  canApprove: boolean;
  submittingId: string | null;
  onReview: (id: string, action: "APPROVE" | "REJECT", applyMode?: "AUTO" | "MANUAL") => void;
}) {
  const [autoApply, setAutoApply] = useState(false);

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground truncate">
              {req.targetType === "TASK" ? req.task?.title : req.milestone?.title}
            </span>
            <StatusBadge status={req.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Requested by {req.requestedBy.user.name || req.requestedBy.user.email} on{" "}
            {new Date(req.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right text-xs shrink-0">
          <p>Current: {req.currentDueDate ? new Date(req.currentDueDate).toLocaleDateString() : "None"}</p>
          <p className="font-medium text-blue-600 dark:text-blue-400">
            Requested: {new Date(req.requestedDueDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {req.reason && (
        <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">"{req.reason}"</p>
      )}

      {req.status === "PENDING" && canApprove && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Checkbox className="border-white data-[state=checked]:border-white cursor-pointer" id={`auto-${req.id}`} checked={autoApply} onCheckedChange={(v) => setAutoApply(!!v)} />
            <label htmlFor={`auto-${req.id}`} className="text-sm text-muted-foreground cursor-pointer">
              Automatically apply the new due date on approval
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
              disabled={submittingId === req.id}
              onClick={() => onReview(req.id, "REJECT")}
            >
              Reject
            </Button>
            <Button
              size="sm"
              className="cursor-pointer"
              disabled={submittingId === req.id}
              onClick={() => onReview(req.id, "APPROVE", autoApply ? "AUTO" : "MANUAL")}
            >
              Approve
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestList({
  loading,
  filtered,
  canApprove,
  submittingId,
  onReview,
  emptyLabel,
}: {
  loading: boolean;
  filtered: ExtensionRequest[];
  canApprove: boolean;
  submittingId: string | null;
  onReview: (id: string, action: "APPROVE" | "REJECT", applyMode?: "AUTO" | "MANUAL") => void;
  emptyLabel: string;
}) {
  if (loading) return <p className="text-sm text-muted-foreground py-4">Loading requests...</p>;
  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  return (
    <>
      {filtered.map((req) => (
        <RequestCard key={req.id} req={req} canApprove={canApprove} submittingId={submittingId} onReview={onReview} />
      ))}
    </>
  );
}

export function DepartmentExtensionRequestsDialog({
  planId,
  deptId,
  deptName,
  open,
  onOpenChange,
  canApprove,
}: {
  planId: string;
  deptId: string;
  deptName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canApprove: boolean;
}) {
  const [requests, setRequests] = useState<ExtensionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { show } = useSnackbar();

  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [tab, setTab] = useState<"TASK" | "MILESTONE">("TASK");
  const [emailFilter, setEmailFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchRequests = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const res = await authClient.request(`/api/plan/${planId}/departments/${deptId}/extension-requests`);
      setRequests(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch extension requests:", err);
    } finally {
      setLoading(false);
    }
  }, [planId, deptId, open]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!open) {
      setEmailFilter("");
      setFromDate("");
      setToDate("");
      setTab("TASK");
    }
  }, [open]);

  const handleReview = async (id: string, action: "APPROVE" | "REJECT", applyMode?: "AUTO" | "MANUAL") => {
    setSubmittingId(id);
    try {
      await authClient.request(`/api/plan/${planId}/extension-requests/${id}`, {
        method: "PATCH",
        data: { action, applyMode },
      });
      show(`Request ${action === "APPROVE" ? "approved" : "rejected"} successfully`, "success");
      fetchRequests();
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
      show(`Failed to ${action.toLowerCase()} request`, "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const filtered = useMemo(() => {
    return requests
      .filter((r) => r.targetType === tab)
      .filter((r) =>
        emailFilter.trim()
          ? r.requestedBy.user.email.toLowerCase().includes(emailFilter.trim().toLowerCase())
          : true
      )
      .filter((r) => (fromDate ? new Date(r.requestedDueDate) >= new Date(fromDate) : true))
      .filter((r) => (toDate ? new Date(r.requestedDueDate) <= new Date(toDate) : true));
  }, [requests, tab, emailFilter, fromDate, toDate]);

  const hasActiveFilters = emailFilter || fromDate || toDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deptName} - Extension Requests</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "TASK" | "MILESTONE")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="TASK" className="cursor-pointer">
              Tasks ({requests.filter((r) => r.targetType === "TASK").length})
            </TabsTrigger>
            <TabsTrigger value="MILESTONE" className="cursor-pointer">
              Milestones ({requests.filter((r) => r.targetType === "MILESTONE").length})
            </TabsTrigger>
          </TabsList>

          {/* filter row — shared across both tabs */}
          <div className="flex flex-wrap items-end gap-3 py-4 border-b border-border">
            <div className="flex-1 min-w-[180px] space-y-1">
              <Label className="text-xs text-muted-foreground">Requester email</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Requested due from</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Requested due to</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9" />
            </div>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 cursor-pointer gap-1 text-muted-foreground"
                onClick={() => {
                  setEmailFilter("");
                  setFromDate("");
                  setToDate("");
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          <TabsContent value="TASK" className="space-y-4 pt-4">
            <RequestList
              loading={loading}
              filtered={filtered}
              canApprove={canApprove}
              submittingId={submittingId}
              onReview={handleReview}
              emptyLabel="No task extension requests match your filters."
            />
          </TabsContent>

          <TabsContent value="MILESTONE" className="space-y-4 pt-4">
            <RequestList
              loading={loading}
              filtered={filtered}
              canApprove={canApprove}
              submittingId={submittingId}
              onReview={handleReview}
              emptyLabel="No milestone extension requests match your filters."
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}