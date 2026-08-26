-- CreateTable
CREATE TABLE "milestone_extension_logs" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "previousDueDate" TIMESTAMP(3),
    "newDueDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "extendedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_extension_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "milestone_extension_logs_milestoneId_idx" ON "milestone_extension_logs"("milestoneId");

-- AddForeignKey
ALTER TABLE "milestone_extension_logs" ADD CONSTRAINT "milestone_extension_logs_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_extension_logs" ADD CONSTRAINT "milestone_extension_logs_extendedById_fkey" FOREIGN KEY ("extendedById") REFERENCES "work_item_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
