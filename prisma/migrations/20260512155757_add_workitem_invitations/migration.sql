/*
  Warnings:

  - You are about to drop the column `status` on the `work_item_members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "work_item_members" DROP COLUMN "status";

-- CreateTable
CREATE TABLE "WorkItemInvitation" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItemInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkItemInvitation_token_key" ON "WorkItemInvitation"("token");

-- AddForeignKey
ALTER TABLE "WorkItemInvitation" ADD CONSTRAINT "WorkItemInvitation_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
