/*
  Warnings:

  - You are about to drop the column `loggedById` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `income` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "IncomeStatus" AS ENUM ('EXPECTED', 'RECEIVED', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IncomeType" ADD VALUE 'SPONSORSHIP';
ALTER TYPE "IncomeType" ADD VALUE 'DONATION';
ALTER TYPE "IncomeType" ADD VALUE 'GRANT';
ALTER TYPE "IncomeType" ADD VALUE 'MERCHANDISE';
ALTER TYPE "IncomeType" ADD VALUE 'REFUND';
ALTER TYPE "IncomeType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "loggedById",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedById" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "requestedById" TEXT,
ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "occurredAt" DROP NOT NULL,
ALTER COLUMN "occurredAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "income" DROP COLUMN "amount",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "expectedAmount" DECIMAL(12,2),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "receivedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" "IncomeStatus" NOT NULL DEFAULT 'EXPECTED',
ALTER COLUMN "receivedAt" DROP NOT NULL,
ALTER COLUMN "receivedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "expenses_workItemId_idx" ON "expenses"("workItemId");

-- CreateIndex
CREATE INDEX "expenses_phaseId_idx" ON "expenses"("phaseId");

-- CreateIndex
CREATE INDEX "expenses_departmentId_idx" ON "expenses"("departmentId");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_paymentStatus_idx" ON "expenses"("paymentStatus");

-- CreateIndex
CREATE INDEX "income_workItemId_idx" ON "income"("workItemId");

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "work_item_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "work_item_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "work_item_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "work_item_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
