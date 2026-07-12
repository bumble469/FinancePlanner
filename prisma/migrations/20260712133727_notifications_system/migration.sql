-- CreateEnum
CREATE TYPE "NotificationScope" AS ENUM ('GENERAL', 'PERSONAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVITATION', 'TASK_ASSIGNED', 'TASK_CREATED', 'PERMISSIONS_UPDATED', 'MILESTONE_CREATED', 'MILESTONE_TASK_INCLUDED', 'MILESTONE_UPDATED', 'MEMBER_JOINED_DEPARTMENT', 'INCOME_ADDED', 'EXPENSE_REQUESTED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'DOCUMENT_UPLOADED');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "NotificationScope" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_workItemId_userId_isRead_idx" ON "notifications"("workItemId", "userId", "isRead");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
