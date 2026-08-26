"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { authClient } from "@/lib/auth-client";
import { Search } from "lucide-react";

interface PlanOption {
  id: string;
  name: string;
}

export function EmailUpdatesToggle() {
  const [enabled, setEnabled] = useState(true);
  const [scope, setScope] = useState<"ALL" | "SPECIFIC">("ALL");
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [prefsRes, plansRes] = await Promise.all([
          authClient.request("/api/settings/email-notifications", { method: "GET" }),
          authClient.request("/api/plan", { method: "GET" }),
        ]);

        setEnabled(prefsRes.data.enabled);
        setScope(prefsRes.data.scope);
        setSelectedPlanIds(prefsRes.data.planIds);

        const myPlans = plansRes.data.data?.myPlans || [];
        const collaborations = plansRes.data.data?.collaborations || [];
        const allPlans = [...myPlans, ...collaborations].map((p: any) => ({
          id: p.id,
          name: p.name,
        }));
        setPlans(allPlans);
      } catch (err) {
        console.error("Failed to load email notification settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function save(next: { enabled?: boolean; scope?: "ALL" | "SPECIFIC"; planIds?: string[] }) {
    setIsSaving(true);
    try {
      await authClient.request("/api/settings/email-notifications", {
        method: "PATCH",
        data: next,
      });
    } catch (err) {
      console.error("Failed to save email notification settings", err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleEnabledChange(value: boolean) {
    setEnabled(value);
    save({ enabled: value });
  }

  function handleScopeChange(value: "ALL" | "SPECIFIC") {
    setScope(value);
    save({ scope: value, ...(value === "SPECIFIC" && { planIds: selectedPlanIds }) });
  }

  function togglePlan(planId: string) {
    const next = selectedPlanIds.includes(planId)
      ? selectedPlanIds.filter((id) => id !== planId)
      : [...selectedPlanIds, planId];
    setSelectedPlanIds(next);
    save({ scope: "SPECIFIC", planIds: next });
  }

  const filteredPlans = plans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div className="mt-4 h-20 rounded-lg border border-border p-4 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base font-semibold">Receive Email Updates</Label>
          <p className="text-sm text-muted-foreground">
            Get emailed about plan updates, invitations, and warnings.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleEnabledChange} disabled={isSaving} />
      </div>

      {enabled && (
        <div className="space-y-3 border-t border-border pt-4">
          <RadioGroup value={scope} onValueChange={(v) => handleScopeChange(v as "ALL" | "SPECIFIC")}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="ALL" id="scope-all" />
              <Label htmlFor="scope-all" className="font-normal">
                Email me for all plans
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="SPECIFIC" id="scope-specific" />
              <Label htmlFor="scope-specific" className="font-normal">
                Only for plans I select
              </Label>
            </div>
          </RadioGroup>

          {scope === "SPECIFIC" && (
            <div className="space-y-2 pl-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plans..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="max-h-48 space-y-1 overflow-y-auto">
                {filteredPlans.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">No plans found.</p>
                ) : (
                  filteredPlans.map((plan) => (
                    <div key={plan.id} className="flex items-center gap-2 py-1">
                      <Checkbox
                        id={`plan-${plan.id}`}
                        checked={selectedPlanIds.includes(plan.id)}
                        onCheckedChange={() => togglePlan(plan.id)}
                      />
                      <Label htmlFor={`plan-${plan.id}`} className="font-normal">
                        {plan.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}