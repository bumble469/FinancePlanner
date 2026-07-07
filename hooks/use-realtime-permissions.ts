"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket-client";
import { useFinancialStore } from "@/lib/store";

type MemberUpdatedPayload = {
  planId: string;
  memberId: string;
  role: string;
  permissions: unknown;
  departmentIds: string[];
};

export function useRealtimePermissions(planId: string | undefined) {
  const currentPlanMeta = useFinancialStore((s) => s.currentPlanMeta);
  const setCurrentPlanMeta = useFinancialStore((s) => s.setCurrentPlanMeta);

  useEffect(() => {
    if (!planId) return;
    const socket = getSocket();

    function handleMemberUpdated(payload: MemberUpdatedPayload) {
      if (payload.planId !== planId) return;
      if (!currentPlanMeta || currentPlanMeta.memberId !== payload.memberId) return;

      setCurrentPlanMeta({
        ...currentPlanMeta,
        role: payload.role,
        permissions: payload.permissions as any,
        departmentIds: payload.departmentIds,
      });
    }

    socket.on("plan:member-updated", handleMemberUpdated);
    return () => {
      socket.off("plan:member-updated", handleMemberUpdated);
    };
  }, [planId, currentPlanMeta, setCurrentPlanMeta]);
}