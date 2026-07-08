import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string; taskId: string }> };

const ALLOWED_EMOJI = ["👍", "🔥", "✅", "❤️"];

async function resolveAccess(planId: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { userId } });
  const isOwner = account
    ? !!(await prisma.workItem.findFirst({ where: { id: planId, accountId: account.id } }))
    : false;

  if (isOwner) return { isOwner: true, role: "OWNER" as const, memberId: null as string | null };

  const member = await prisma.workItemMember.findFirst({
    where: { workItemId: planId, userId },
    include: { departmentMembers: { select: { departmentId: true } } },
  });
  if (!member) return null;

  return {
    isOwner: false,
    role: member.role,
    memberId: member.id as string | null,
    deptIds: member.departmentMembers.map((d) => d.departmentId),
  };
}

function canNoteOrReact(access: any, task: { departmentId: string | null }): boolean {
  if (access.isOwner || access.role === "ADMIN" || access.role === "CO_ADMIN") return true;
  if (access.role === "MANAGER" && task.departmentId && access.deptIds?.includes(task.departmentId)) return true;
  return false;
}

// PUT /api/plan/[id]/my-work/tasks/[taskId]/reactions — set/replace my reaction
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, taskId } = await params;
    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const task = await prisma.task.findFirst({ where: { id: taskId, workItemId: planId } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    if (!canNoteOrReact(access, task)) {
      return NextResponse.json({ error: "You don't have permission to react to this task" }, { status: 403 });
    }
    if (access.isOwner) {
      return NextResponse.json({ error: "Reactions require a member record" }, { status: 400 });
    }

    const body = await req.json();
    const emoji = body.emoji;
    if (!ALLOWED_EMOJI.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    const reaction = await prisma.taskReaction.upsert({
      where: { taskId_authorId: { taskId, authorId: access.memberId! } },
      update: { emoji },
      create: { taskId, authorId: access.memberId!, emoji },
      include: { author: { include: { user: { select: { name: true } } } } },
    });

    return NextResponse.json({
      success: true,
      data: { id: reaction.id, emoji: reaction.emoji, authorName: reaction.author.user.name, authorId: reaction.authorId },
    });
  } catch (err) {
    console.error("[PUT /my-work/tasks/:taskId/reactions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove my own reaction
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, taskId } = await params;
    const access = await resolveAccess(planId, user.sub);
    if (!access || access.isOwner || !access.memberId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.taskReaction.deleteMany({ where: { taskId, authorId: access.memberId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /my-work/tasks/:taskId/reactions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}