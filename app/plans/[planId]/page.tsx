"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFinancialStore } from "@/lib/store";
import { authClient } from "@/lib/auth-client";

export default function PlanDashboardPage() {
  const params = useParams();
  const planId = params.planId as string;
  const { updateEventData, setCurrentPlanId } = useFinancialStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planId) return;

    const init = async () => {
      try {
        setCurrentPlanId(planId);
        const res = await authClient.request(`/api/plan/${planId}`, {
          method: "GET"
        });
        const data = res.data.data;

        useFinancialStore.getState().setPlanMeta({
          eventBudget: data.budget,
          departments: data.departments || [],
          modules: data.modules || [],
          currency: data.currency,
        });
      } catch (err) {
        console.error("Failed to fetch plan:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [planId]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return <DashboardLayout planId={planId} />;
}