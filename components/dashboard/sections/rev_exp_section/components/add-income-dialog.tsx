"use client";

import { useEffect, useState } from "react";
import { useFinancialStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Income, IncomeType } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Income | null;
  onClose: () => void;
  workItemId: string;
}

const EMPTY = {
  type: "" as IncomeType | "",
  amount: "",
  receivedAmount: "",
  source: "",
  description: "",
  phaseId: "",
  receivedAt: new Date().toISOString().split("T")[0],
};

export function AddIncomeDialog({ open, onOpenChange, editing, onClose, workItemId }: Props) {
  const { addIncome, updateIncome, modules } = useFinancialStore();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        type: editing.type,
        amount: editing.amount.toString(),
        receivedAmount: editing.receivedAmount?.toString() ?? "0",
        source: editing.source ?? "",
        description: editing.description ?? "",
        phaseId: editing.phaseId ?? "",
        receivedAt: new Date(editing.receivedAt ?? Date.now())
          .toISOString()
          .split("T")[0],
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [editing, open]);

  function validate() {
    const e: typeof errors = {};
    if (!form.type) e.type = "Select a type";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount";
    if (form.receivedAmount && (isNaN(Number(form.receivedAmount)) || Number(form.receivedAmount) < 0))
      e.receivedAmount = "Enter a valid received amount";
    if (form.receivedAmount && Number(form.receivedAmount) > Number(form.amount))
      e.receivedAmount = "Cannot exceed the total amount";
    if (!form.source.trim()) e.source = "Source is required";
    if (!form.receivedAt) e.receivedAt = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);

    const payload = {
      type: form.type as IncomeType,
      amount: Number(form.amount),
      receivedAmount: form.receivedAmount ? Number(form.receivedAmount) : 0,
      source: form.source.trim(),
      description: form.description.trim() || undefined,
      phaseId: form.phaseId || undefined,
      receivedAt: new Date(form.receivedAt).toISOString(),
    };

    try {
      const { authClient } = await import("@/lib/auth-client");

      if (editing) {
        // PATCH /api/plan/[id]/income/[incomeId]
        const res = await authClient.request(
          `/api/plan/${workItemId}/income/${editing.id}`,
          { method: "PATCH", data: payload }
        );
        updateIncome(editing.id, res.data.data);
      } else {
        // POST /api/plan/[id]/income
        const res = await authClient.request(
          `/api/plan/${workItemId}/income`,
          { method: "POST", data: payload }
        );
        addIncome(res.data.data);
      }

      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Something went wrong";
      setErrors((prev) => ({ ...prev, source: msg }));
      console.error("Income submit error:", err);
    } finally {
      setLoading(false);
    }
  }

  function set<K extends keyof typeof EMPTY>(key: K, val: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit income" : "Add income"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v as IncomeType)}>
              <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INVESTMENT">Investment</SelectItem>
                <SelectItem value="REVENUE">Revenue</SelectItem>
                <SelectItem value="SPONSORSHIP">Sponsorship</SelectItem>
                <SelectItem value="DONATION">Donation</SelectItem>
                <SelectItem value="GRANT">Grant</SelectItem>
                <SelectItem value="CLIENT_PAYMENT">Client Payment</SelectItem>
                <SelectItem value="MERCHANDISE">Merchandise</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>

            </Select>
            {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Input
              placeholder="e.g. Sponsor — Reliance, Ticket sales"
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className={errors.source ? "border-destructive" : ""}
            />
            {errors.source && <p className="text-xs text-destructive">{errors.source}</p>}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0"
              min={0}
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Received amount (optional) — drives Expected/Partial/Received status */}
          <div className="space-y-1.5">
            <Label>
              Received amount{" "}
              <span className="text-xs text-muted-foreground font-normal">(optional — leave 0 if still expected)</span>
            </Label>
            <Input
              type="number"
              placeholder="0"
              min={0}
              value={form.receivedAmount}
              onChange={(e) => set("receivedAmount", e.target.value)}
              className={errors.receivedAmount ? "border-destructive" : ""}
            />
            {errors.receivedAmount && <p className="text-xs text-destructive">{errors.receivedAmount}</p>}
          </div>

          {/* Module (optional) */}
          <div className="space-y-1.5">
            <Label>
              Module{" "}
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select
              value={form.phaseId || "none"}
              onValueChange={(v) => set("phaseId", v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Overall (no module)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Overall (no module)</SelectItem>
                {modules?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Received on</Label>
            <Input
              type="date"
              value={form.receivedAt}
              onChange={(e) => set("receivedAt", e.target.value)}
              className={errors.receivedAt ? "border-destructive" : ""}
            />
            {errors.receivedAt && (
              <p className="text-xs text-destructive">{errors.receivedAt}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>
              Description{" "}
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              placeholder="Any additional notes"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editing ? "Update" : "Add"} income
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
