/*
  Warnings:

  - You are about to drop the `WorkItemInvitation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WorkItemInvitation" DROP CONSTRAINT "WorkItemInvitation_workItemId_fkey";

-- DropTable
DROP TABLE "WorkItemInvitation";

-- CreateTable
CREATE TABLE "WorkItemMemberInvitation" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItemMemberInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkItemMemberInvitation_token_key" ON "WorkItemMemberInvitation"("token");

-- AddForeignKey
ALTER TABLE "WorkItemMemberInvitation" ADD CONSTRAINT "WorkItemMemberInvitation_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
