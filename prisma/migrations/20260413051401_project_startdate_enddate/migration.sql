/*
  Warnings:

  - You are about to drop the column `deadline` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "deadline",
ADD COLUMN     "endDate" TIMESTAMP(3);
