"use client";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { useFinancialStore } from "@/lib/store";

type ItemType = "task" | "phase" | "milestone" | "hardware";

export function useEditLock(itemType: ItemType, itemId: string | null, isDialogOpen: boolean) {
  const { currentPlanId, currentPlanMeta, currentUser } = useFinancialStore();
  const allowMultipleEditing = currentPlanMeta?.allowMultipleEditing ?? true;

  const [locked, setLocked] = useState(false);
  const [lockedByName, setLockedByName] = useState<string | null>(null);
  const heldLock = useRef(false);

  useEffect(() => {
    if (!isDialogOpen || !itemId || !currentPlanId || allowMultipleEditing) {
      setLocked(false);
      setLockedByName(null);
      return;
    }

    const socket = getSocket();
    let heartbeat: ReturnType<typeof setInterval>;

    socket.emit(
      "editing:request-lock",
      { planId: currentPlanId, itemType, itemId, userName: currentUser?.name ?? "Someone" },
      (res: { granted: boolean; lockedByName?: string }) => {
        if (res.granted) {
          heldLock.current = true;
          setLocked(false);
          heartbeat = setInterval(() => {
            socket.emit("editing:heartbeat", { planId: currentPlanId, itemType, itemId });
          }, 30_000);
        } else {
          heldLock.current = false;
          setLocked(true);
          setLockedByName(res.lockedByName ?? "another user");
        }
      }
    );

    const onReleased = (data: { itemType: string; itemId: string }) => {
      if (data.itemType === itemType && data.itemId === itemId) {
        setLocked(false);
        setLockedByName(null);
      }
    };
    socket.on("editing:lock-released", onReleased);

    return () => {
      clearInterval(heartbeat);
      socket.off("editing:lock-released", onReleased);
      if (heldLock.current) {
        socket.emit("editing:release-lock", { planId: currentPlanId, itemType, itemId });
        heldLock.current = false;
      }
    };
  }, [isDialogOpen, itemId, currentPlanId, allowMultipleEditing, itemType]);

  return { locked, lockedByName, allowMultipleEditing };
}