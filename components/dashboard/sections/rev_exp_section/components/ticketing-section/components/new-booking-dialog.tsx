"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { TicketType } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  ticketTypes: TicketType[];
  onBooked: () => void;
}

const EMPTY = {
  ticketTypeId: "",
  bookedByName: "",
  bookedByEmail: "",
  bookedByPhone: "",
  quantity: "1",
};

export function NewBookingDialog({ open, onOpenChange, planId, ticketTypes, onBooked }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => { if (open) { setForm(EMPTY); setError(""); setDuplicateWarning(null); } }, [open]);

  const submit = async (forceCreate = false) => {
    if (!form.ticketTypeId) return setError("Select a ticket type");
    if (!form.bookedByName.trim()) return setError("Booker name is required");
    if (!form.bookedByEmail.trim() && !form.bookedByPhone.trim()) return setError("Enter an email or phone number");

    setLoading(true);
    setError("");
    try {
      await authClient.request(`/api/plan/${planId}/ticket-bookings`, {
        method: "POST",
        data: {
          ticketTypeId: form.ticketTypeId,
          bookedByName: form.bookedByName.trim(),
          bookedByEmail: form.bookedByEmail.trim() || undefined,
          bookedByPhone: form.bookedByPhone.trim() || undefined,
          quantity: Number(form.quantity) || 1,
          forceCreate,
        },
      });
      onBooked();
      onOpenChange(false);
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 409 && data?.warning) {
        setDuplicateWarning(data.message || "A booking with this email/phone already exists.");
      } else {
        setError(data?.error || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Ticket type</Label>
              <Select value={form.ticketTypeId} onValueChange={(v) => setForm((f) => ({ ...f, ticketTypeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select ticket type" /></SelectTrigger>
                <SelectContent>
                  {ticketTypes.filter((t) => t.isActive).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} — {t.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Booker name</Label>
              <Input value={form.bookedByName} onChange={(e) => setForm((f) => ({ ...f, bookedByName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email <span className="text-xs text-muted-foreground font-normal">(one required)</span></Label>
                <Input type="email" value={form.bookedByEmail} onChange={(e) => setForm((f) => ({ ...f, bookedByEmail: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.bookedByPhone} onChange={(e) => setForm((f) => ({ ...f, bookedByPhone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button onClick={() => submit(false)} disabled={loading}>
                {loading ? "Booking..." : "Create booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!duplicateWarning} onOpenChange={(v) => { if (!v) setDuplicateWarning(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Possible duplicate booking</AlertDialogTitle>
            <AlertDialogDescription>{duplicateWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDuplicateWarning(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDuplicateWarning(null); submit(true); }}>
              Book anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}