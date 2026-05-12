/*
  Warnings:

  - You are about to drop the column `assignedToId` on the `tasks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignedToId_fkey";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "assignedToId";

-- CreateTable
CREATE TABLE "task_members" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workItemMemberId" TEXT NOT NULL,

    CONSTRAINT "task_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_members_taskId_workItemMemberId_key" ON "task_members"("taskId", "workItemMemberId");

-- AddForeignKey
ALTER TABLE "task_members" ADD CONSTRAINT "task_members_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_members" ADD CONSTRAINT "task_members_workItemMemberId_fkey" FOREIGN KEY ("workItemMemberId") REFERENCES "work_item_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
