-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'RAZORPAY');

-- CreateEnum
CREATE TYPE "RazorpayMethod" AS ENUM ('UPI', 'CARD', 'NETBANKING', 'WALLET');

-- AlterTable
ALTER TABLE "ticket_bookings" ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "razorpayMethod" "RazorpayMethod";
