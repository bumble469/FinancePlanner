"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { TicketBooking } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: TicketBooking | null;
  eventName: string;
}

function TicketCard({ booking, eventName, attendeeName }: { booking: TicketBooking; eventName: string; attendeeName: string }) {
  return (
    <div className="ticket-card rounded-xl border-2 border-dashed border-foreground/30 p-5 space-y-3 break-inside-avoid">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{eventName}</p>
          <p className="text-lg font-bold text-foreground">{booking.ticketType?.name ?? "Ticket"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Booking code</p>
          <p className="font-mono text-sm font-semibold">{booking.bookingCode}</p>
        </div>
      </div>
      <div className="border-t border-dashed border-foreground/30 pt-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Attendee</p>
          <p className="font-medium text-foreground">{attendeeName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Booked by</p>
          <p className="text-sm">{booking.bookedByName}</p>
        </div>
      </div>
      <div className="flex items-center justify-center pt-2">
        {/* Simple scannable-looking block using the booking code — swap for a real QR lib if desired */}
        <div className="font-mono text-[10px] tracking-widest text-center border border-foreground/20 rounded px-3 py-2">
          {booking.bookingCode}
        </div>
      </div>
    </div>
  );
}

export function TicketViewDialog({ open, onOpenChange, booking, eventName }: Props) {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg print:max-w-none print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Ticket{booking.attendees.length > 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>

        <div id="ticket-print-area" className="space-y-3">
          {booking.attendees.map((a) => (
            <TicketCard key={a.id} booking={booking} eventName={eventName} attendeeName={a.name} />
          ))}
        </div>

        <div className="flex justify-end gap-2 print:hidden pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            Print ticket{booking.attendees.length > 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>

      {/* Print-only isolation: hide everything except the ticket area when printing */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #ticket-print-area, #ticket-print-area * { visibility: visible; }
          #ticket-print-area { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </Dialog>
  );
}