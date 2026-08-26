import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

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

    // prevent inviting someone who's already a member
    const existingMember = await prisma.workItemMember.findFirst({
      where: {
        workItemId: planId,
        userId: invitedUser.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this plan" },
        { status: 409 }
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

    await notify({
      workItemId: planId,
      userIds: [invitedUser.id],
      scope: "PERSONAL",
      type: "INVITATION",
      title: "You've been invited to a project",
      message: `${authUser.name ?? "Someone"} invited you to join as ${role ?? "a member"}.`,
      entityType: "invitation",
      entityId: invitation.id,
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