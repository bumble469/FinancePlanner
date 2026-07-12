import { prisma } from "@/lib/prisma";
import { emitToUser } from "@/lib/socket-server";
import type { NotificationType, NotificationScope } from "@prisma/client";

export async function notify({
  workItemId,
  userIds,
  scope,
  type,
  title,
  message,
  entityType,
  entityId,
}: {
  workItemId: string;
  userIds: string[];
  scope: NotificationScope;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  const recipients = Array.from(new Set(userIds)).filter(Boolean);
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      workItemId,
      userId,
      scope,
      type,
      title,
      message,
      entityType,
      entityId,
    })),
  });

  const createdAt = new Date().toISOString();
  for (const userId of recipients) {
    emitToUser(userId, "notification:new", {
      workItemId,
      scope,
      type,
      title,
      message,
      entityType,
      entityId,
      createdAt,
    });
  }
}

export async function getDepartmentMemberUserIds(departmentIds: string[], excludeUserId?: string) {
  const rows = await prisma.departmentMember.findMany({
    where: { departmentId: { in: departmentIds } },
    select: { workItemMember: { select: { userId: true } } },
  });
  const ids = rows.map((r) => r.workItemMember.userId);
  return Array.from(new Set(ids)).filter((id) => id !== excludeUserId);
}

// Plan owner + every ADMIN/CO_ADMIN member — used for plan-wide governance events
export async function getPlanAdminUserIds(workItemId: string) {
  const workItem = await prisma.workItem.findUnique({
    where: { id: workItemId },
    include: { account: true },
  });
  const admins = await prisma.workItemMember.findMany({
    where: { workItemId, role: { in: ["ADMIN", "CO_ADMIN"] } },
    select: { userId: true },
  });
  const ids = admins.map((a) => a.userId);
  if (workItem?.account?.userId) ids.push(workItem.account.userId);
  return Array.from(new Set(ids));
}

// Every member currently on the plan (any role), used for plan-wide broadcasts
export async function getAllPlanUserIds(workItemId: string, excludeUserId?: string) {
  const workItem = await prisma.workItem.findUnique({
    where: { id: workItemId },
    include: { account: true },
  });
  const members = await prisma.workItemMember.findMany({
    where: { workItemId },
    select: { userId: true },
  });
  const ids = members.map((m) => m.userId);
  if (workItem?.account?.userId) ids.push(workItem.account.userId);
  return Array.from(new Set(ids)).filter((id) => id !== excludeUserId);
}