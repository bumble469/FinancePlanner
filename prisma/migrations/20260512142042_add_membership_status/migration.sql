-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "work_item_members" ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING';
