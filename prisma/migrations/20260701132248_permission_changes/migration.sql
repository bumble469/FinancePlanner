-- AlterTable
ALTER TABLE "work_item_members" ADD COLUMN     "permissions" JSONB;

-- CreateTable
CREATE TABLE "permission_audit_logs" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "targetMemberId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "previousPermissions" JSONB,
    "newPermissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permission_audit_logs_workItemId_targetMemberId_idx" ON "permission_audit_logs"("workItemId", "targetMemberId");

-- AddForeignKey
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_targetMemberId_fkey" FOREIGN KEY ("targetMemberId") REFERENCES "work_item_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "work_item_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
