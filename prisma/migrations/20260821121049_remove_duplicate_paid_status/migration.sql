/*
  Warnings:

  - The values [PAID] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'PARTIAL', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'OVERDUE');
ALTER TABLE "public"."expenses" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "public"."income" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "public"."subscription_payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."ticket_bookings" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "income" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TABLE "expenses" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TABLE "ticket_bookings" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TABLE "subscription_payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "expenses" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
ALTER TABLE "income" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
ALTER TABLE "subscription_payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "ticket_bookings" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
COMMIT;
