-- CreateEnum
CREATE TYPE "SubscriptionPlanCode" AS ENUM ('FREE', 'STARTER', 'PRO', 'SCALE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'STRIPE', 'MANUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE 'PAID';
ALTER TYPE "PaymentStatus" ADD VALUE 'FAILED';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "code" "SubscriptionPlanCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "maxProjects" INTEGER NOT NULL,
    "maxEvents" INTEGER NOT NULL,
    "maxTotalWorkItems" INTEGER,
    "maxMembersPerWorkItem" INTEGER,
    "maxStorageBytes" BIGINT,
    "maxDepartments" INTEGER,
    "maxTasksPerWorkItem" INTEGER,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_prices" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "billingInterval" "BillingInterval" NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "plan_prices_currency_billingInterval_idx" ON "plan_prices"("currency", "billingInterval");

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_planId_currency_billingInterval_key" ON "plan_prices"("planId", "currency", "billingInterval");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_accountId_key" ON "subscriptions"("accountId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_currentPeriodEnd_idx" ON "subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_providerOrderId_key" ON "subscription_payments"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_providerPaymentId_key" ON "subscription_payments"("providerPaymentId");

-- CreateIndex
CREATE INDEX "subscription_payments_subscriptionId_idx" ON "subscription_payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments"("status");

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "plan_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
