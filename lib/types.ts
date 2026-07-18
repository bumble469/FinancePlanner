// Financial Dashboard Types - Multi-Plan Architecture

// ============================================================
// ACCOUNT LEVEL
// ============================================================

export type AccountType = "individual" | "company";
export type PlanType = "project" | "event";
export type PlanStatus = "active" | "completed";
export const ROLES = [
  "ADMIN",
  "CO_ADMIN",
  "MANAGER",
  "CO_MANAGER",
  "MEMBER",
] as const;

export type Role = (typeof ROLES)[number];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: Date;
  members?: string[];
}

export interface Plan {
  id: string;
  accountId: string;
  name: string;
  type: PlanType;
  status: PlanStatus;
  budget: number;
  spent: number;
  createdAt: Date;
  teamMembers: TeamMember[];
  project: any;
  event: any;
  expenses: Expense[];
  eventData?: EventData;
  simulation: SimulationModifiers;
  currency: string;
  description: string;
  mode: "project" | "event";
}

// ============================================================
// PLAN CONTENT TYPES
// ============================================================

export type Mode = "project" | "event";

export type Department = {
  id: string;
  name: string;
  budget: number;
};

export interface Module {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}

type DepartmentMember = {
  department: {
    id: string;
    name: string;
  };
};

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  user: any;
  userId: string;
  departmentMembers?: DepartmentMember[];
  permissions?: Record<string, any> | null;
  monthlyCost: number;
  departmentCostShares?: Record<string, number>;
}

export type ExpenseStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PARTIAL"
  | "COMPLETED"
  | "OVERDUE";

export type IncomeStatus =
  | "EXPECTED"
  | "PARTIAL"
  | "RECEIVED"
  | "CANCELLED";

export type ExpenseCategory =
  | "SALARY"
  | "TOOLS"
  | "MARKETING"
  | "OPERATIONS"
  | "EVENT"
  | "OTHER";

export type FinancialStatus = "healthy" | "warning" | "risk";

export type IncomeType =
  | "REVENUE"
  | "INVESTMENT"
  | "SPONSORSHIP"
  | "DONATION"
  | "GRANT"
  | "MERCHANDISE"
  | "REFUND"
  | "CLIENT_PAYMENT"
  | "OTHER";

export interface Expense {
  id: string;

  workItemId: string;

  phaseId?: string;
  phaseName?: string;

  departmentId?: string;
  departmentName?: string;

  category: ExpenseCategory;

  amount: number;
  paidAmount: number;

  status: ExpenseStatus;
  paymentStatus: PaymentStatus;

  requestedById?: string;
  requestedByName?: string;
  approvedById?: string;
  approvedByName?: string;
  rejectedById?: string;
  rejectedByName?: string;

  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  description?: string;

  occurredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;

  workItemId: string;

  phaseId?: string;
  phaseName?: string;

  departmentId?: string;
  departmentName?: string;

  type: IncomeType;

  amount: number;
  receivedAmount: number;

  status: IncomeStatus;
  paymentStatus: PaymentStatus;

  source?: string;
  description?: string;

  createdById?: string;
  createdByName?: string;

  receivedAt?: string;
  createdAt: string;
}

export interface EventData {
  estimatedAttendance: number;
  ticketPrice: number;
  expectedRevenue: number;
  eventBudget: number;
}

export interface SimulationModifiers {
  costMultiplier: number;
  additionalMembers: number;
  revenueAdjustment: number;
  isSimulating: boolean;
}

export interface FinancialMetrics {
  totalBudget: number;
  totalSpent: number;
  remainingBalance: number;
  estimatedProfitLoss: number;
}

// ================= MILESTONE =================

export type MilestoneStatus = "UPCOMING" | "IN_PROGRESS" | "ACHIEVED" | "MISSED";

export interface MilestoneTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: number;
  startDate?: string;
  dueDate?: string;
  originalDueDate?: string;
  extensionReason?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  originalDueDate?: string;
  extensionReason?: string;
  status: MilestoneStatus;
  achievedAt?: string;
  departmentId?: string;
  tasks: MilestoneTask[];
}

export interface MilestoneFormData {
  title: string;
  description?: string;
  dueDate?: string;
  status: MilestoneStatus;
  departmentId?: string;
  phaseId?: string;
  taskIds: string[];
}

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "DONE"
  | "BLOCKED"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "COMPLETED";

export interface TaskAssignee {
  id: string; // WorkItemMember id
  name: string | null;
  image: string | null;
}

export interface TaskMilestoneRef {
  id: string;
  title: string;
  status: MilestoneStatus;
}

export interface TaskRequirement {
  requireApproval: boolean;
  requireDescription: boolean;
  requireImages: boolean;
  minImages: number | null;
  maxImages: number | null;
  requireVideo: boolean;
  requireDocument: boolean;
  allowMultipleEvidenceTypes: boolean;
}

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  workItemId?: string;
  departmentId?: string;
  phaseId?: string;
  startDate?: string;
  dueDate?: string;
  originalDueDate?: string;
  extensionReason?: string;
  completedAt?: string;
  assignees?: TaskAssignee[];
  dependsOnIds?: string[];
  milestones?: TaskMilestoneRef[];
  requirement?: TaskRequirement | null;
  createdAt?: string;
  updatedAt?: string;
};

export interface ExtensionRequest {
  id: string;

  targetType: "TASK" | "MILESTONE";
  status: "PENDING" | "APPROVED" | "REJECTED";

  taskId?: string;
  milestoneId?: string;

  currentDueDate?: string;
  requestedDueDate: string;

  reason: string;

  reviewNote?: string;
  applyMode?: string;

  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;

  requestedBy: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  };

  reviewedBy?: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  } | null;

  task?: {
    id: string;
    title: string;
  } | null;

  milestone?: {
    id: string;
    title: string;
    dueDate?: string;
  } | null;

  department?: {
    id: string;
    name: string;
  } | null;
}