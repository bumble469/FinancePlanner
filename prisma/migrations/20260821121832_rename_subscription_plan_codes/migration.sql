/*
  Warnings:

  - The values [FREE,PRO,SCALE] on the enum `SubscriptionPlanCode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPlanCode_new" AS ENUM ('STARTER', 'BASIC', 'EMPLOYER', 'MANAGER');
ALTER TABLE "subscription_plans" ALTER COLUMN "code" TYPE "SubscriptionPlanCode_new" USING ("code"::text::"SubscriptionPlanCode_new");
ALTER TYPE "SubscriptionPlanCode" RENAME TO "SubscriptionPlanCode_old";
ALTER TYPE "SubscriptionPlanCode_new" RENAME TO "SubscriptionPlanCode";
DROP TYPE "public"."SubscriptionPlanCode_old";
COMMIT;
