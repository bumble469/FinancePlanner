/*
  Warnings:

  - A unique constraint covering the columns `[taskId]` on the table `milestone_tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "milestone_tasks_taskId_key" ON "milestone_tasks"("taskId");
