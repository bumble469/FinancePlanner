"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor, Settings as SettingsIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useFinancialStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface PlanSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
}

export function PlanSettingsDialog({ open, onOpenChange, planId }: PlanSettingsDialogProps) {
  const { currentPlanMeta, setCurrentPlanMeta } = useFinancialStore();
  const { theme, setTheme } = useTheme();

  const [receivingEmails, setReceivingEmails] = useState(true);
  const [loadingEmailPref, setLoadingEmailPref] = useState(true);
  const [savingEmailPref, setSavingEmailPref] = useState(false);

  const [allowMultipleEditing, setAllowMultipleEditing] = useState(
    currentPlanMeta?.allowMultipleEditing ?? true
  );
  const [savingEditingPref, setSavingEditingPref] = useState(false);

  useEffect(() => {
    if (!open || !planId) return;
    setLoadingEmailPref(true);
    authClient
      .request(`/api/plan/${planId}/email-preference`)
      .then((res) => setReceivingEmails(res.data.receiving))
      .catch((err) => console.error("Failed to fetch email preference:", err))
      .finally(() => setLoadingEmailPref(false));
  }, [open, planId]);

  useEffect(() => {
    setAllowMultipleEditing(currentPlanMeta?.allowMultipleEditing ?? true);
  }, [currentPlanMeta?.allowMultipleEditing]);

  const handleEmailToggle = async (value: boolean) => {
    setReceivingEmails(value);
    setSavingEmailPref(true);
    try {
      await authClient.request(`/api/plan/${planId}/email-preference`, {
        method: "PATCH",
        data: { receiving: value },
      });
    } catch (err) {
      console.error("Failed to update email preference:", err);
      setReceivingEmails(!value);
    } finally {
      setSavingEmailPref(false);
    }
  };

  const handleEditingToggle = async (value: boolean) => {
    setAllowMultipleEditing(value);
    setSavingEditingPref(true);
    try {
      await authClient.request(`/api/plan/${planId}`, {
        method: "PATCH",
        data: { allowMultipleEditing: value },
      });
      if (currentPlanMeta) {
        setCurrentPlanMeta({ ...currentPlanMeta, allowMultipleEditing: value });
      }
    } catch (err) {
      console.error("Failed to update editing preference:", err);
      setAllowMultipleEditing(!value);
    } finally {
      setSavingEditingPref(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Plan Settings
          </DialogTitle>
          <DialogDescription>
            Settings for {currentPlanMeta?.name ?? "this plan"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" className="cursor-pointer">General</TabsTrigger>
            <TabsTrigger value="appearance" className="cursor-pointer">Appearance</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="pr-4">
                <Label>Receive email updates</Label>
                <p className="text-xs text-muted-foreground">
                  Get emailed about updates, invitations, and warnings for this plan.
                </p>
              </div>
              <Switch
                checked={receivingEmails}
                onCheckedChange={handleEmailToggle}
                disabled={loadingEmailPref || savingEmailPref}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="pr-4">
                <Label>Allow multiple editing</Label>
                <p className="text-xs text-muted-foreground">
                  {allowMultipleEditing
                    ? "Multiple people can edit the same item at once."
                    : "Only one person can edit an item at a time."}
                </p>
              </div>
              <Switch
                checked={allowMultipleEditing}
                onCheckedChange={handleEditingToggle}
                disabled={savingEditingPref}
              />
            </div>
          </TabsContent>

          {/* APPEARANCE TAB — frontend-only, no backend logic */}
          <TabsContent value="appearance" className="space-y-4">
            <div className="rounded-lg border border-border px-4 py-3 space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors cursor-pointer",
                        active
                          ? "border-foreground bg-muted/40 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
