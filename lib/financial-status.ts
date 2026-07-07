import type { ExpenseStatus, IncomeStatus, PaymentStatus } from "./types";

export function deriveIncomeStatus(
  amount: number,
  receivedAmount: number
): { status: IncomeStatus; paymentStatus: PaymentStatus } {
  if (receivedAmount <= 0) return { status: "EXPECTED", paymentStatus: "PENDING" };
  if (receivedAmount < amount) return { status: "PARTIAL", paymentStatus: "PARTIAL" };
  return { status: "RECEIVED", paymentStatus: "COMPLETED" };
}

export function deriveExpensePaymentStatus(
  amount: number,
  paidAmount: number
): { status: Extract<ExpenseStatus, "APPROVED" | "PARTIALLY_PAID" | "PAID">; paymentStatus: PaymentStatus } {
  if (paidAmount <= 0) return { status: "APPROVED", paymentStatus: "PENDING" };
  if (paidAmount < amount) return { status: "PARTIALLY_PAID", paymentStatus: "PARTIAL" };
  return { status: "PAID", paymentStatus: "COMPLETED" };
}