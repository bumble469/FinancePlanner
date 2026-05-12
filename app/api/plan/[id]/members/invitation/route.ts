import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: planId } = await params;
    const body = await req.json();

    const {
      invitedUserId,
      role,
    } = body;

    if (!invitedUserId) {
      return NextResponse.json(
        { error: "invitedUserId is required" },
        { status: 400 }
      );
    }

    // find invited user
    const invitedUser = await prisma.user.findUnique({
      where: { id: invitedUserId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // prevent duplicate pending invite
    const existingInvite =
      await prisma.workItemMemberInvitation.findFirst({
        where: {
          workItemId: planId,
          email: invitedUser.email,
          status: "PENDING",
        },
      });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invitation already pending" },
        { status: 409 }
      );
    }

    const invitation =
      await prisma.workItemMemberInvitation.create({
        data: {
          workItemId: planId,
          invitedById: authUser.sub,
          email: invitedUser.email,
          role,
          status: "PENDING",
          token: randomUUID(),
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ),
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Invitation sent successfully",
        data: invitation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[INVITE_MEMBER_ERROR]", error);

    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}