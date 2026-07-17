"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ClockArrowUp, Search, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useSnackbar } from "@/lib/useSnackbar";
import { ExtensionRequest } from "@/lib/types";

interface Props {
  planId: string;
  requests: ExtensionRequest[];
  canApprove: boolean;
  loading?: boolean;
  onReviewed?: () => void;
  trigger?: React.ReactNode;
}

export function ViewRequestExtensionDialog({
  planId,
  requests,
  canApprove,
  loading,
  onReviewed,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const { show } = useSnackbar();

  const [emailFilter, setEmailFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    return requests
      .filter((r) =>
        emailFilter.trim()
          ? ((r.requestedBy?.user as any)?.email ?? "").toLowerCase().includes(emailFilter.trim().toLowerCase())
          : true
      )
      .filter((r) => (fromDate ? new Date(r.requestedDueDate) >= new Date(fromDate) : true))
      .filter((r) => (toDate ? new Date(r.requestedDueDate) <= new Date(toDate) : true));
  }, [requests, emailFilter, fromDate, toDate]);

  const hasActiveFilters = emailFilter || fromDate || toDate;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setEmailFilter("");
          setFromDate("");
          setToDate("");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="icon" variant="ghost">
            <ClockArrowUp className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Milestone Extension Requests</DialogTitle>
        </DialogHeader>

        {/* filter row */}
        <div className="flex flex-wrap items-end gap-3 pb-4 border-b border-border">
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

        <div className="space-y-4 pt-2">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {requests.length === 0 ? "No extension requests yet." : "No requests match your filters."}
            </p>
          ) : (
            filtered.map((request) => (
              <RequestRow
                key={request.id}
                planId={planId}
                request={request}
                canApprove={canApprove}
                onReviewed={onReviewed}
                show={show}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RequestRow({
  planId,
  request,
  canApprove,
  onReviewed,
  show,
}: {
  planId: string;
  request: ExtensionRequest;
  canApprove: boolean;
  onReviewed?: () => void;
  show: (msg: string, type?: "success" | "error") => void;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [autoApply, setAutoApply] = useState(false);
  const [loading, setLoading] = useState(false);

  const itemLabel = request.milestone?.title ?? "Untitled";

  const extensionDays = request.currentDueDate
    ? Math.ceil(
        (new Date(request.requestedDueDate).getTime() - new Date(request.currentDueDate).getTime()) / 86400000
      )
    : null;

  async function review(action: "APPROVE" | "REJECT") {
    try {
      setLoading(true);
      await authClient.request(`/api/plan/${planId}/extension-requests/${request.id}`, {
        method: "PATCH",
        data: {
          action,
          reviewNote: reviewNote.trim() || undefined,
          ...(action === "APPROVE" ? { applyMode: autoApply ? "AUTO" : "MANUAL" } : {}),
        },
      });
      show(action === "APPROVE" ? "Extension approved" : "Extension rejected", "success");
      onReviewed?.();
    } catch (err: any) {
      show(err?.response?.data?.error || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{itemLabel}</p>
          <p className="text-sm text-muted-foreground">Milestone</p>
        </div>
        <Badge
          variant={
            request.status === "PENDING" ? "secondary" : request.status === "APPROVED" ? "default" : "destructive"
          }
        >
          {request.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Requested By</p>
          <p className="font-medium">{request.requestedBy?.user?.name ?? "Unknown"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Department</p>
          <p className="font-medium">{request.department?.name ?? "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Current Due Date</p>
          <p className="font-medium">
            {request.currentDueDate ? new Date(request.currentDueDate).toLocaleDateString("en-IN") : "-"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Requested Due Date</p>
          <p className="font-medium">{new Date(request.requestedDueDate).toLocaleDateString("en-IN")}</p>
        </div>
        {extensionDays !== null && (
          <div>
            <p className="text-muted-foreground">Extension</p>
            <p className="font-medium">+{extensionDays} day(s)</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground">Requested On</p>
          <p className="font-medium">{new Date(request.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Reason</p>
        <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">{request.reason}</div>
      </div>

      {request.status === "PENDING" && canApprove && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Review Note</p>
            <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Optional..." />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id={`auto-apply-${request.id}`} checked={autoApply} onCheckedChange={(v) => setAutoApply(!!v)} />
            <label htmlFor={`auto-apply-${request.id}`} className="text-sm text-muted-foreground cursor-pointer">
              Automatically apply the new due date on approval
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="destructive" onClick={() => review("REJECT")} disabled={loading} className="cursor-pointer">
              Reject
            </Button>
            <Button onClick={() => review("APPROVE")} disabled={loading} className="cursor-pointer">
              Approve
            </Button>
          </div>
        </div>
      )}

      {request.status !== "PENDING" && (
        <div className="rounded-md border p-3 space-y-1 text-sm">
          <p>
            <strong>Reviewed By:</strong> {request.reviewedBy?.user?.name ?? "-"}
          </p>
          <p>
            <strong>Reviewed At:</strong>{" "}
            {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString("en-IN") : "-"}
          </p>
          {request.reviewNote && (
            <p>
              <strong>Review Note:</strong> {request.reviewNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}