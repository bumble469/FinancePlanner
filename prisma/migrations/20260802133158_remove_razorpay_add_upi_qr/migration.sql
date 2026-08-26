/*
  Warnings:

  - The values [RAZORPAY] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `razorpayOrderId` on the `ticket_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayPaymentId` on the `ticket_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `razorpaySubMethod` on the `ticket_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayVpa` on the `ticket_bookings` table. All the data in the column will be lost.
  - You are about to drop the `ticket_booking_intents` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'UPI');
ALTER TABLE "ticket_bookings" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ticket_booking_intents" DROP CONSTRAINT "ticket_booking_intents_ticketTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_booking_intents" DROP CONSTRAINT "ticket_booking_intents_workItemId_fkey";

-- DropIndex
DROP INDEX "ticket_bookings_razorpayOrderId_key";

-- DropIndex
DROP INDEX "ticket_bookings_razorpayPaymentId_key";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "upiQrPath" TEXT,
ADD COLUMN     "upiQrUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "upiQrUploadedById" TEXT,
ADD COLUMN     "upiQrUrl" TEXT;

-- AlterTable
ALTER TABLE "ticket_bookings" DROP COLUMN "razorpayOrderId",
DROP COLUMN "razorpayPaymentId",
DROP COLUMN "razorpaySubMethod",
DROP COLUMN "razorpayVpa";

-- DropTable
DROP TABLE "ticket_booking_intents";

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_upiQrUploadedById_fkey" FOREIGN KEY ("upiQrUploadedById") REFERENCES "work_item_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
