-- CreateEnum
CREATE TYPE "TicketBookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "IncomeType" ADD VALUE 'STALL_INCOME';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "hasStalls" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasTicketing" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "stallId" TEXT;

-- AlterTable
ALTER TABLE "income" ADD COLUMN     "stallId" TEXT;

-- CreateTable
CREATE TABLE "stalls" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stall_members" (
    "id" TEXT NOT NULL,
    "stallId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workItemMemberId" TEXT NOT NULL,

    CONSTRAINT "stall_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "capacity" INTEGER,
    "salesStart" TIMESTAMP(3),
    "salesEnd" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_bookings" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "bookedByName" TEXT NOT NULL,
    "bookedByEmail" TEXT,
    "bookedByPhone" TEXT,
    "quantity" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "TicketBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "bookingCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attendees" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "checkedInById" TEXT,

    CONSTRAINT "ticket_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stalls_workItemId_name_key" ON "stalls"("workItemId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "stall_members_stallId_userId_key" ON "stall_members"("stallId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_bookings_bookingCode_key" ON "ticket_bookings"("bookingCode");

-- CreateIndex
CREATE INDEX "ticket_bookings_workItemId_idx" ON "ticket_bookings"("workItemId");

-- CreateIndex
CREATE INDEX "ticket_bookings_ticketTypeId_idx" ON "ticket_bookings"("ticketTypeId");

-- CreateIndex
CREATE INDEX "ticket_attendees_bookingId_idx" ON "ticket_attendees"("bookingId");

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "stalls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "stalls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stalls" ADD CONSTRAINT "stalls_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stall_members" ADD CONSTRAINT "stall_members_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "stalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stall_members" ADD CONSTRAINT "stall_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stall_members" ADD CONSTRAINT "stall_members_workItemMemberId_fkey" FOREIGN KEY ("workItemMemberId") REFERENCES "work_item_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_bookings" ADD CONSTRAINT "ticket_bookings_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_bookings" ADD CONSTRAINT "ticket_bookings_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attendees" ADD CONSTRAINT "ticket_attendees_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ticket_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attendees" ADD CONSTRAINT "ticket_attendees_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "work_item_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
