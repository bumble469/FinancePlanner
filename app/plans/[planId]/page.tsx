"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useParams } from "next/navigation";

/**
 * Plan Dashboard Route: /plans/[planId]
 * 
 * This route loads the individual plan dashboard
 */

export default function PlanDashboardPage() {
  const params = useParams();
  const planId = params.planId as string;

  return <DashboardLayout planId={planId} />;
}
