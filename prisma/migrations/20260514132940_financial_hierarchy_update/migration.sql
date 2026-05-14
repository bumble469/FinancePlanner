/*
  Warnings:

  - Added the required column `workItemId` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_phaseId_fkey";

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "workItemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "income" ADD COLUMN     "departmentId" TEXT;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
