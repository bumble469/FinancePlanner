/*
  Warnings:

  - You are about to drop the column `status` on the `hardware_items` table. All the data in the column will be lost.
  - Added the required column `requestedById` to the `hardware_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HardwareRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "HardwareCondition" AS ENUM ('WORKING', 'IN_USE', 'BROKEN_DOWN', 'PURCHASED', 'RETURNED', 'LOST');

-- AlterTable
ALTER TABLE "hardware_items" DROP COLUMN "status",
ADD COLUMN     "condition" "HardwareCondition",
ADD COLUMN     "declineReason" TEXT,
ADD COLUMN     "lastBilledAt" TIMESTAMP(3),
ADD COLUMN     "monthlyRentAmount" DECIMAL(12,2),
ADD COLUMN     "requestStatus" "HardwareRequestStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "requestedById" TEXT NOT NULL,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- DropEnum
DROP TYPE "HardwareStatus";

-- AddForeignKey
ALTER TABLE "hardware_items" ADD CONSTRAINT "hardware_items_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "work_item_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_items" ADD CONSTRAINT "hardware_items_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "work_item_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
