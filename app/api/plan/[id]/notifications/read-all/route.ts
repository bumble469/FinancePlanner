import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workItemId } = await params;
    const body = await req.json().catch(() => ({}));
    const scope = body.scope; // optional: "GENERAL" | "PERSONAL"

    await prisma.notification.updateMany({
      where: {
        workItemId,
        userId: user.sub,
        isRead: false,
        ...(scope === "GENERAL" || scope === "PERSONAL" ? { scope } : {}),
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /notifications/read-all]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}