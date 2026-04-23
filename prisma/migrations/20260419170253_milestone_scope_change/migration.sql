/*
  Warnings:

  - You are about to drop the column `departmentId` on the `milestones` table. All the data in the column will be lost.
  - You are about to drop the column `phaseId` on the `milestones` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "milestones" DROP CONSTRAINT "milestones_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "milestones" DROP CONSTRAINT "milestones_phaseId_fkey";

-- AlterTable
ALTER TABLE "milestones" DROP COLUMN "departmentId",
DROP COLUMN "phaseId";
