/*
  Warnings:

  - You are about to drop the `PhaseMember` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `workItemId` to the `income` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('UPCOMING', 'IN_PROGRESS', 'ACHIEVED', 'MISSED');

-- DropForeignKey
ALTER TABLE "PhaseMember" DROP CONSTRAINT "PhaseMember_phaseId_fkey";

-- DropForeignKey
ALTER TABLE "PhaseMember" DROP CONSTRAINT "PhaseMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "PhaseMember" DROP CONSTRAINT "PhaseMember_workItemMemberId_fkey";

-- DropForeignKey
ALTER TABLE "income" DROP CONSTRAINT "income_phaseId_fkey";

-- AlterTable
ALTER TABLE "income" ADD COLUMN     "source" TEXT,
ADD COLUMN     "workItemId" TEXT NOT NULL,
ALTER COLUMN "phaseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "PhaseMember";

-- CreateTable
CREATE TABLE "phase_members" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workItemMemberId" TEXT NOT NULL,

    CONSTRAINT "phase_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "phaseId" TEXT,
    "departmentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'UPCOMING',
    "achievedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_tasks" (
    "milestoneId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "milestone_tasks_pkey" PRIMARY KEY ("milestoneId","taskId")
);

-- CreateIndex
CREATE UNIQUE INDEX "phase_members_phaseId_userId_key" ON "phase_members"("phaseId", "userId");

-- AddForeignKey
ALTER TABLE "phase_members" ADD CONSTRAINT "phase_members_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_members" ADD CONSTRAINT "phase_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_members" ADD CONSTRAINT "phase_members_workItemMemberId_fkey" FOREIGN KEY ("workItemMemberId") REFERENCES "work_item_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_tasks" ADD CONSTRAINT "milestone_tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_tasks" ADD CONSTRAINT "milestone_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
