-- CreateEnum
CREATE TYPE "HardwareCategory" AS ENUM ('AV', 'FURNITURE', 'ELECTRICAL', 'STRUCTURAL', 'IT', 'OTHER');

-- CreateEnum
CREATE TYPE "HardwareSource" AS ENUM ('OWNED', 'RENTED', 'BORROWED');

-- CreateEnum
CREATE TYPE "HardwareStatus" AS ENUM ('REQUESTED', 'ORDERED', 'DELIVERED', 'IN_USE', 'RETURNED', 'DAMAGED', 'LOST');

-- AlterEnum
ALTER TYPE "ExpenseCategory" ADD VALUE 'EQUIPMENT';

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "hardwareItemId" TEXT;

-- CreateTable
CREATE TABLE "hardware_items" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "HardwareCategory" NOT NULL,
    "source" "HardwareSource" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "vendor" TEXT,
    "departmentId" TEXT,
    "stallId" TEXT,
    "rentalStart" TIMESTAMP(3),
    "rentalEnd" TIMESTAMP(3),
    "depositAmount" DECIMAL(12,2),
    "depositReturned" BOOLEAN NOT NULL DEFAULT false,
    "status" "HardwareStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_hardwareItemId_fkey" FOREIGN KEY ("hardwareItemId") REFERENCES "hardware_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_items" ADD CONSTRAINT "hardware_items_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_items" ADD CONSTRAINT "hardware_items_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_items" ADD CONSTRAINT "hardware_items_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "stalls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
