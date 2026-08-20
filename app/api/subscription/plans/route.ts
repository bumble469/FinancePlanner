import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlans.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      include: {
        prices: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            currency: true,
            billingInterval: true,
            amount: true,
          },
          orderBy: {
            amount: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscription plans",
      },
      { status: 500 }
    );
  }
}