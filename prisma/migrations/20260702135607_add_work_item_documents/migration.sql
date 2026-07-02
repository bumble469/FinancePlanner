-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('NOTE', 'DOCUMENT');

-- CreateTable
CREATE TABLE "work_item_documents" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileSize" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_item_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "work_item_documents" ADD CONSTRAINT "work_item_documents_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_documents" ADD CONSTRAINT "work_item_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
