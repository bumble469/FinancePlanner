/*
  Warnings:

  - The values [DOCUMENT] on the enum `DocType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocType_new" AS ENUM ('NOTE', 'FILE');
ALTER TABLE "work_item_documents" ALTER COLUMN "type" TYPE "DocType_new" USING ("type"::text::"DocType_new");
ALTER TYPE "DocType" RENAME TO "DocType_old";
ALTER TYPE "DocType_new" RENAME TO "DocType";
DROP TYPE "public"."DocType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "work_item_documents" DROP CONSTRAINT "work_item_documents_uploadedById_fkey";

-- AlterTable
ALTER TABLE "work_item_documents" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "mimeType" TEXT,
ALTER COLUMN "uploadedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "work_item_documents" ADD CONSTRAINT "work_item_documents_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_documents" ADD CONSTRAINT "work_item_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
