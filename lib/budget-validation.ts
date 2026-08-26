import { prisma } from "@/lib/prisma";

export function getProjectDurationMonths(
  project: { startDate: Date | null; endDate: Date | null } | null
): number | null {
  if (!project?.startDate || !project?.endDate) return null;

  const start = new Date(project.startDate);
  const end = new Date(project.endDate);

  if (end <= start) return null;

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  if (end.getDate() > start.getDate()) {
    months++;
  }

  return Math.max(1, months);
}

type BudgetCheckResult =
  | { ok: true; durationMonths: number; durationKnown: boolean }
  | { ok: false; error: string };


export async function validateMemberBudget({
  planId,
  role,
  departmentIds,
  monthlyCost,
  departmentShares,
  excludeMemberId,
}: {
  planId: string;
  role: string;
  departmentIds: string[];
  monthlyCost: number;
  departmentShares?: Record<string, number>;
  excludeMemberId?: string;
}): Promise<BudgetCheckResult> {
  const workItem = await prisma.workItem.findUnique({
    where: { id: planId },
    include: { project: true },
  });
  if (!workItem) return { ok: false, error: "Plan not found" };

  const durationMonths = getProjectDurationMonths(workItem.project) ?? 1;
  const durationKnown = getProjectDurationMonths(workItem.project) !== null;
  const newTotalCost = monthlyCost * durationMonths;

  if (role === "CO_ADMIN") {
    const totalBudget = Number(workItem.budget ?? 0);
    if (totalBudget <= 0) return { ok: true, durationMonths, durationKnown };

    const others = await prisma.workItemMember.findMany({
      where: {
        workItemId: planId,
        ...(excludeMemberId ? { id: { not: excludeMemberId } } : {}),
      },
      select: { monthlyCost: true },
    });
    const othersTotal = others.reduce((sum, m) => sum + Number(m.monthlyCost ?? 0) * durationMonths, 0);

    if (othersTotal + newTotalCost > totalBudget) {
      return {
        ok: false,
        error: `This would commit ₹${(othersTotal + newTotalCost).toLocaleString("en-IN")} against a total plan budget of ₹${totalBudget.toLocaleString("en-IN")}${durationKnown ? ` over ${durationMonths} month(s)` : " (monthly cost only — plan has no defined duration)"}.`,
      };
    }
    return { ok: true, durationMonths, durationKnown };
  }

  // MANAGER / CO_MANAGER / MEMBER — check against each assigned department's budget
  if (departmentIds.length === 0) return { ok: true, durationMonths, durationKnown };

  for (const departmentId of departmentIds) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) continue;
    const deptBudget = Number(department.budget ?? 0);
    if (deptBudget <= 0) continue;

    const deptMembers = await prisma.departmentMember.findMany({
      where: {
        departmentId,
        ...(excludeMemberId ? { workItemMemberId: { not: excludeMemberId } } : {}),
      },
      select: { costShare: true },
    });
    const othersTotal = deptMembers.reduce(
      (sum, dm) => sum + Number(dm.costShare ?? 0) * durationMonths,
      0
    );

    const thisMemberShare =
      (departmentShares?.[departmentId] ?? monthlyCost) * durationMonths;

    if (othersTotal + thisMemberShare > deptBudget) {
      return {
        ok: false,
        error: `"${department.name}" would be committed to ₹${(othersTotal + thisMemberShare).toLocaleString("en-IN")} against its budget of ₹${deptBudget.toLocaleString("en-IN")}${durationKnown ? ` over ${durationMonths} month(s)` : " (monthly cost only — plan has no defined duration)"}.`,
      };
    }
  }

  return { ok: true, durationMonths, durationKnown };
}