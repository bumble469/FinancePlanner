import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string; notificationId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workItemId, notificationId } = await params;

    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, workItemId, userId: user.sub },
    });
    if (!existing) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /notifications/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}