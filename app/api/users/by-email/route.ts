import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authuser = await getAuthUser();
    if (!authuser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const planId = searchParams.get("planId"); // ← add this

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Get existing member userIds for this plan
    const existingUserIds = planId
      ? (await prisma.workItemMember.findMany({
          where: { workItemId: planId },
          select: { userId: true },
        })).map((m) => m.userId)
      : [];

    const users = await prisma.user.findMany({
      where: {
        email: { contains: email, mode: "insensitive" },
        ...(existingUserIds.length > 0 && {
          id: { notIn: existingUserIds }, // ← exclude existing members
        }),
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}