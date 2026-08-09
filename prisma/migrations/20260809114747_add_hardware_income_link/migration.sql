-- AlterTable
ALTER TABLE "income" ADD COLUMN     "hardwareItemId" TEXT;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_hardwareItemId_fkey" FOREIGN KEY ("hardwareItemId") REFERENCES "hardware_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
