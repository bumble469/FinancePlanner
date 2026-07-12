"use client";
import { NotificationBell } from "../components/notification-bell";

interface TopbarProps {
  title: string;
  planId: string;
}

export function Topbar({ title, planId }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <NotificationBell planId={planId} />
    </header>
  );
}