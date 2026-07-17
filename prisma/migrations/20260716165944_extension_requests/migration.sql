-- CreateEnum
CREATE TYPE "ExtensionTargetType" AS ENUM ('TASK', 'MILESTONE');

-- CreateEnum
CREATE TYPE "ExtensionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'EXTENSION_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'EXTENSION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'EXTENSION_REJECTED';

-- CreateTable
CREATE TABLE "extension_requests" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "targetType" "ExtensionTargetType" NOT NULL,
    "taskId" TEXT,
    "milestoneId" TEXT,
    "departmentId" TEXT,
    "currentDueDate" TIMESTAMP(3),
    "requestedDueDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ExtensionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "applyMode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extension_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extension_requests_workItemId_idx" ON "extension_requests"("workItemId");

-- CreateIndex
CREATE INDEX "extension_requests_departmentId_idx" ON "extension_requests"("departmentId");

-- CreateIndex
CREATE INDEX "extension_requests_status_idx" ON "extension_requests"("status");

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "work_item_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "work_item_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
