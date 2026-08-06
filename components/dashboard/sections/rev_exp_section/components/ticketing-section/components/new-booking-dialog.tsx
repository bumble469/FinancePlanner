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
  upiQrUrl?: string | null;
  onBooked: (booking: any) => void;
}

const EMPTY = {
  ticketTypeId: "",
  bookedByName: "",
  bookedByEmail: "",
  bookedByPhone: "",
  quantity: "1",
  paymentMethod: "" as "" | "CASH" | "UPI",
};

export function NewBookingDialog({ open, onOpenChange, planId, ticketTypes, upiQrUrl, onBooked }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError("");
      setDuplicateWarning(null);
      setShowQr(false);
    }
  }, [open]);

  const validateBaseForm = () => {
    if (!form.ticketTypeId) return "Select a ticket type";
    if (!form.bookedByName.trim()) return "Booker name is required";
    if (!form.bookedByEmail.trim() && !form.bookedByPhone.trim()) return "Enter an email or phone number";
    return "";
  };

  const submit = async (forceCreate = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await authClient.request(`/api/plan/${planId}/ticket-bookings`, {
        method: "POST",
        data: {
          ticketTypeId: form.ticketTypeId,
          bookedByName: form.bookedByName.trim(),
          bookedByEmail: form.bookedByEmail.trim() || undefined,
          bookedByPhone: form.bookedByPhone.trim() || undefined,
          quantity: Number(form.quantity) || 1,
          forceCreate,
          paymentMethod: form.paymentMethod,
        },
      });
      onBooked(res.data.data);
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

  const handlePrimaryAction = () => {
    const baseError = validateBaseForm();
    if (baseError) return setError(baseError);

    if (!form.paymentMethod) return setError("Select a payment method");

    if (form.paymentMethod === "CASH") {
      submit(false);
      return;
    }

    // UPI: first click reveals the QR for the buyer to scan; second click ("Confirm booking") finalizes.
    if (!showQr) {
      setShowQr(true);
      return;
    }
    submit(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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

            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) => { setForm((f) => ({ ...f, paymentMethod: v as any })); setShowQr(false); }}
              >
                <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI" disabled={!upiQrUrl}>
                    UPI {!upiQrUrl && "(no QR uploaded yet)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.paymentMethod === "UPI" && showQr && upiQrUrl && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 bg-muted/20">
                <p className="text-xs text-muted-foreground">Show this to the buyer to scan and pay</p>
                <img src={upiQrUrl} alt="UPI QR code" className="w-48 h-48 object-contain rounded-md border border-border" />
                <p className="text-xs text-muted-foreground text-center">
                  Once payment is received, click "Confirm booking" below.
                </p>
              </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="cursor-pointer hover:text-gray-600">Cancel</Button>
              <Button onClick={handlePrimaryAction} disabled={loading} className="cursor-pointer">
                {loading
                  ? "Processing..."
                  : form.paymentMethod === "UPI"
                    ? (showQr ? "Confirm booking" : "Show QR")
                    : "Finish"}
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