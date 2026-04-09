import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authuser = await getAuthUser();
    if (!authuser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findMany({
      where: {
        email: {
            contains: email,
            mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}