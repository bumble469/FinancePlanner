"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function EmailUpdatesToggle() {
  const [receiveEmails, setReceiveEmails] = useState(true);

  return (
    <div className="flex items-center justify-between mt-4 rounded-lg border border-border p-4">
      <div className="space-y-0.5">
        <Label className="text-base font-semibold">Receive Email Updates</Label>
        <p className="text-sm text-muted-foreground">
          Get notified about plan updates, invitations, and warnings.
        </p>
      </div>
      <Switch
        checked={receiveEmails}
        onCheckedChange={setReceiveEmails}
      />
    </div>
  );
}
