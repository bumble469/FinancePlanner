/*
  Warnings:

  - You are about to drop the column `razorpayMethod` on the `ticket_bookings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[razorpayOrderId]` on the table `ticket_bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayPaymentId]` on the table `ticket_bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ticket_bookings" DROP COLUMN "razorpayMethod",
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySubMethod" TEXT,
ADD COLUMN     "razorpayVpa" TEXT;

-- DropEnum
DROP TYPE "RazorpayMethod";

-- CreateTable
CREATE TABLE "ticket_booking_intents" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "bookedByName" TEXT NOT NULL,
    "bookedByEmail" TEXT,
    "bookedByPhone" TEXT,
    "quantity" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "attendeesJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_booking_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_booking_intents_razorpayOrderId_key" ON "ticket_booking_intents"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_bookings_razorpayOrderId_key" ON "ticket_bookings"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_bookings_razorpayPaymentId_key" ON "ticket_bookings"("razorpayPaymentId");

-- AddForeignKey
ALTER TABLE "ticket_booking_intents" ADD CONSTRAINT "ticket_booking_intents_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_booking_intents" ADD CONSTRAINT "ticket_booking_intents_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
