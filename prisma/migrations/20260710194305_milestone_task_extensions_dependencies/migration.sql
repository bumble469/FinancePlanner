-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "extensionReason" TEXT,
ADD COLUMN     "originalDueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "extensionReason" TEXT,
ADD COLUMN     "originalDueDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_taskId_dependsOnId_key" ON "task_dependencies"("taskId", "dependsOnId");

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
