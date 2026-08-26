-- CreateEnum
CREATE TYPE "EmailNotificationScope" AS ENUM ('ALL', 'SPECIFIC');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailNotificationScope" "EmailNotificationScope" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "user_email_notification_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_email_notification_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_notification_plans_userId_workItemId_key" ON "user_email_notification_plans"("userId", "workItemId");

-- AddForeignKey
ALTER TABLE "user_email_notification_plans" ADD CONSTRAINT "user_email_notification_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_email_notification_plans" ADD CONSTRAINT "user_email_notification_plans_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
