/*
  Warnings:

  - You are about to drop the column `expectedAmount` on the `income` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "income" DROP COLUMN "expectedAmount",
ADD COLUMN     "amount" DECIMAL(12,2);
