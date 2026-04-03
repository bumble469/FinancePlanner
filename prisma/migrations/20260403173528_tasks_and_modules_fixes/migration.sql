-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "phaseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "phases" ADD COLUMN     "departmentId" TEXT;

-- CreateTable
CREATE TABLE "PhaseMember" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workItemMemberId" TEXT NOT NULL,

    CONSTRAINT "PhaseMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "workItemId" TEXT NOT NULL,
    "departmentId" TEXT,
    "phaseId" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhaseMember_phaseId_userId_key" ON "PhaseMember"("phaseId", "userId");

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseMember" ADD CONSTRAINT "PhaseMember_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseMember" ADD CONSTRAINT "PhaseMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseMember" ADD CONSTRAINT "PhaseMember_workItemMemberId_fkey" FOREIGN KEY ("workItemMemberId") REFERENCES "work_item_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
