"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket-client";
import { authClient } from "@/lib/auth-client";

export interface NotificationItem {
  id: string;
  scope: "GENERAL" | "PERSONAL";
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(planId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [general, setGeneral] = useState<NotificationItem[]>([]);
  const [personal, setPersonal] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTab = useCallback(async (scope: "GENERAL" | "PERSONAL") => {
    if (!planId) return;
    setLoading(true);
    try {
      const res = await authClient.request(`/api/plan/${planId}/notifications`, {
        method: "GET",
        params: { scope },
      });
      if (scope === "GENERAL") setGeneral(res.data.data.items);
      else setPersonal(res.data.data.items);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  const refreshUnreadCount = useCallback(async () => {
    if (!planId) return;
    try {
      const res = await authClient.request(`/api/plan/${planId}/notifications`, {
        method: "GET",
        params: { scope: "GENERAL" },
      });
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      console.error("Failed to refresh unread count:", err);
    }
  }, [planId]);

  useEffect(() => {
    if (!planId) return;
    refreshUnreadCount();

    const socket = getSocket();
    function handleNew(payload: { workItemId: string; scope: "GENERAL" | "PERSONAL" }) {
      if (payload.workItemId !== planId) return;
      setUnreadCount((c) => c + 1);
      // prepend into whichever tab it belongs to, if already loaded
      if (payload.scope === "GENERAL") setGeneral((prev) => (prev.length ? [payload as any, ...prev] : prev));
      else setPersonal((prev) => (prev.length ? [payload as any, ...prev] : prev));
    }
    socket.on("notification:new", handleNew);
    return () => {
      socket.off("notification:new", handleNew);
    };
  }, [planId, refreshUnreadCount]);

  const markRead = async (id: string) => {
    if (!planId) return;
    try {
      await authClient.request(`/api/plan/${planId}/notifications/${id}`, { method: "PATCH" });
      setGeneral((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setPersonal((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const markAllRead = async (scope?: "GENERAL" | "PERSONAL") => {
    if (!planId) return;
    try {
      await authClient.request(`/api/plan/${planId}/notifications/read-all`, {
        method: "PATCH",
        data: { scope },
      });
      if (!scope || scope === "GENERAL") setGeneral((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (!scope || scope === "PERSONAL") setPersonal((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshUnreadCount();
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  return { unreadCount, general, personal, loading, fetchTab, markRead, markAllRead };
}