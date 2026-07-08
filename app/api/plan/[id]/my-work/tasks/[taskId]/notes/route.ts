import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string; taskId: string }> };

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

// POST /api/plan/[id]/my-work/tasks/[taskId]/notes — leave a note
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: planId, taskId } = await params;
    const access = await resolveAccess(planId, user.sub);
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const task = await prisma.task.findFirst({ where: { id: taskId, workItemId: planId } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    if (!canNoteOrReact(access, task)) {
      return NextResponse.json({ error: "You don't have permission to add notes to this task" }, { status: 403 });
    }

    if (access.isOwner) {
      return NextResponse.json({ error: "Notes require a member record — please act as a member on this plan" }, { status: 400 });
    }

    const body = await req.json();
    const text = (body.body ?? "").trim();
    if (!text) return NextResponse.json({ error: "Note text is required" }, { status: 400 });

    const note = await prisma.taskNote.create({
      data: { taskId, authorId: access.memberId!, body: text },
      include: { author: { include: { user: { select: { name: true } } } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: note.id,
        body: note.body,
        authorName: note.author.user.name,
        createdAt: note.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /my-work/tasks/:taskId/notes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}