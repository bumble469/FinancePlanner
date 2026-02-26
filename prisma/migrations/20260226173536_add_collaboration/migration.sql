/*
  Warnings:

  - You are about to drop the column `moduleId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the `investments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `revenues` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `phaseId` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('INVESTMENT', 'REVENUE');

-- AlterEnum
ALTER TYPE "WorkItemStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_roleId_fkey";

-- DropForeignKey
ALTER TABLE "investments" DROP CONSTRAINT "investments_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "modules" DROP CONSTRAINT "modules_workItemId_fkey";

-- DropForeignKey
ALTER TABLE "revenues" DROP CONSTRAINT "revenues_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_workItemId_fkey";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "eventDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "moduleId",
DROP COLUMN "roleId",
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "loggedById" TEXT,
ADD COLUMN     "phaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "work_items" ADD COLUMN     "budget" DECIMAL(12,2),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "description" TEXT;

-- DropTable
DROP TABLE "investments";

-- DropTable
DROP TABLE "modules";

-- DropTable
DROP TABLE "revenues";

-- DropTable
DROP TABLE "roles";

-- CreateTable
CREATE TABLE "work_item_members" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_item_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" DECIMAL(12,2),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_members" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workItemMemberId" TEXT NOT NULL,

    CONSTRAINT "department_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "type" "IncomeType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_item_members_workItemId_userId_key" ON "work_item_members"("workItemId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_workItemId_name_key" ON "departments"("workItemId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "department_members_departmentId_userId_key" ON "department_members"("departmentId", "userId");

-- AddForeignKey
ALTER TABLE "work_item_members" ADD CONSTRAINT "work_item_members_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_members" ADD CONSTRAINT "work_item_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_workItemMemberId_fkey" FOREIGN KEY ("workItemMemberId") REFERENCES "work_item_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
