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
  // Plan-specific data
  teamMembers: TeamMember[];
  expenses: Expense[];
  eventData?: EventData;
  simulation: SimulationModifiers;
  currency: string;
  description: string;
  // For event plans: mode is always "event", for project plans: mode is "company"
  mode: "project" | "event";
}

// ============================================================
// PLAN CONTENT TYPES
// ============================================================

export type Mode = "project" | "event";

// ================= DEPARTMENTS =================

export type Department = {
  id: string;
  name: string;
  budget: number;
};

// ================= MODULES (PHASES) =================
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
  monthlyCost: number;
}

export interface Expense {
  id: string;
  workItemId?: string;
  phaseId?: string;
  phaseName?: string;
  departmentId?: string;
  departmentName?: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  occurredAt: string;
}

export type ExpenseCategory =
  | "SALARY"
  | "TOOLS"
  | "MARKETING"
  | "OPERATIONS"
  | "EVENT"
  | "OTHER";

export type FinancialStatus = "healthy" | "warning" | "risk";

export type IncomeType = "INVESTMENT" | "REVENUE";

export interface Income {
  id: string;
  workItemId: string;
  phaseId?: string;
  phaseName?: string;      
  type: IncomeType;
  amount: number;
  source?: string;
  description?: string;
  receivedAt: string;       
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