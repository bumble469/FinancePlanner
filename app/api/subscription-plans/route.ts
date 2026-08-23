import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlans.findMany({
      where: { isPublic: true, isActive: true },
      include: { prices: { where: { isActive: true } } },
      orderBy: { maxTotalWorkItems: { sort: "asc", nulls: "last" } },
    });

    const formatted = plans.map((p) => ({
      ...p,
      maxStorageBytes: p.maxStorageBytes ? p.maxStorageBytes.toString() : null,
      prices: p.prices.map((pr) => ({ ...pr, amount: Number(pr.amount) })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error("[GET /subscription-plans]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}