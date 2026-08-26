"use client";

import { useEffect, useRef } from "react";
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

  const metaRef = useRef(currentPlanMeta);
  useEffect(() => {
    metaRef.current = currentPlanMeta;
  }, [currentPlanMeta]);

  useEffect(() => {
    if (!planId) return;
    const socket = getSocket();

    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
    });

    function handleMemberUpdated(payload: MemberUpdatedPayload) {
      console.log("[socket] plan:member-updated received:", payload, "current meta:", metaRef.current);

      if (payload.planId !== planId) return;
      const meta = metaRef.current;
      if (!meta || meta.memberId !== payload.memberId) return;

      setCurrentPlanMeta({
        ...meta,
        role: payload.role,
        permissions: payload.permissions as any,
        departmentIds: payload.departmentIds,
      });
    }

    socket.on("plan:member-updated", handleMemberUpdated);

    return () => {
      socket.off("plan:member-updated", handleMemberUpdated);
    };
  }, [planId, setCurrentPlanMeta]);
}