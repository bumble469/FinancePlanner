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
  permissions?: [];
  monthlyCost: number;
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
  status: "TODO" | "IN_PROGRESS" | "DONE";
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: MilestoneStatus;
  achievedAt?: string;
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

// ================= TASKS =================

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  workItemId?: string;
  departmentId?: string;
  phaseId?: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    image?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};