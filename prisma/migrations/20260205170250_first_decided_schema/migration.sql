-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'CLUB');

-- CreateEnum
CREATE TYPE "WorkItemType" AS ENUM ('PROJECT', 'EVENT', 'PLAN');

-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARY', 'MARKETING', 'TOOLS', 'OPERATIONS', 'EVENT', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_items" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkItemType" NOT NULL,
    "status" "WorkItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "workItemId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "methodology" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("workItemId")
);

-- CreateTable
CREATE TABLE "events" (
    "workItemId" TEXT NOT NULL,
    "venue" TEXT,
    "expectedCrowd" INTEGER,

    CONSTRAINT "events_pkey" PRIMARY KEY ("workItemId")
);

-- CreateTable
CREATE TABLE "plan_info" (
    "workItemId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "plan_info_pkey" PRIMARY KEY ("workItemId")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" DECIMAL(12,2),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "investedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenues" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moduleId" TEXT NOT NULL,
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_userId_key" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_userId_key" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_workItemId_name_key" ON "roles"("workItemId", "name");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_info" ADD CONSTRAINT "plan_info_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
