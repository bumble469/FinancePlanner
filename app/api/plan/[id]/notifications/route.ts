import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { NotificationScope } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workItemId } = await params;
    const scopeParam = req.nextUrl.searchParams.get("scope");
    const scope: NotificationScope | undefined =
      scopeParam === "GENERAL" || scopeParam === "PERSONAL" ? scopeParam : undefined;

    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
    const pageSize = 20;

    const where = {
      workItemId,
      userId: user.sub,
      ...(scope ? { scope } : {}),
    };

    const [total, unreadCount, unreadGeneral, unreadPersonal, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { workItemId, userId: user.sub, isRead: false } }),
      prisma.notification.count({ where: { workItemId, userId: user.sub, isRead: false, scope: "GENERAL" } }),
      prisma.notification.count({ where: { workItemId, userId: user.sub, isRead: false, scope: "PERSONAL" } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        unreadCount,
        unreadGeneral,
        unreadPersonal,
        page,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (err) {
    console.error("[GET /notifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}