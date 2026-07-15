import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const record = await prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        emailNotificationsEnabled: true,
        emailNotificationScope: true,
        emailNotificationPlans: { select: { workItemId: true } },
      },
    });

    if (!record) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      enabled: record.emailNotificationsEnabled,
      scope: record.emailNotificationScope,
      planIds: record.emailNotificationPlans.map((p) => p.workItemId),
    });
  } catch (err) {
    console.error("[GET /api/settings/email-notifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { enabled, scope, planIds } = body as {
      enabled?: boolean;
      scope?: "ALL" | "SPECIFIC";
      planIds?: string[];
    };

    if (scope !== undefined && !["ALL", "SPECIFIC"].includes(scope)) {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }

    if (scope === "SPECIFIC" && planIds) {
      // Only allow plans the user actually belongs to
      const validMemberships = await prisma.workItemMember.findMany({
        where: { userId: user.sub, workItemId: { in: planIds } },
        select: { workItemId: true },
      });
      const validIds = new Set(validMemberships.map((m) => m.workItemId));
      const filteredIds = planIds.filter((id) => validIds.has(id));

      await prisma.$transaction([
        prisma.userEmailNotificationPlan.deleteMany({ where: { userId: user.sub } }),
        prisma.userEmailNotificationPlan.createMany({
          data: filteredIds.map((workItemId) => ({ userId: user.sub, workItemId })),
        }),
        prisma.user.update({
          where: { id: user.sub },
          data: {
            ...(enabled !== undefined && { emailNotificationsEnabled: enabled }),
            emailNotificationScope: scope,
          },
        }),
      ]);
    } else {
      await prisma.user.update({
        where: { id: user.sub },
        data: {
          ...(enabled !== undefined && { emailNotificationsEnabled: enabled }),
          ...(scope !== undefined && { emailNotificationScope: scope }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/settings/email-notifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}