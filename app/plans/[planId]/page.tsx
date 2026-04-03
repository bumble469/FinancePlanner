"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useParams } from "next/navigation";

export default function PlanDashboardPage() {
  const params = useParams();
  const planId = params.planId as string;

  return <DashboardLayout planId={planId} />;
}
