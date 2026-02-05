// Financial Dashboard Types - Multi-Plan Architecture

// ============================================================
// ACCOUNT LEVEL
// ============================================================

export type AccountType = "individual" | "company";
export type PlanType = "project" | "event";
export type PlanStatus = "active" | "completed";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: Date;
  // For company accounts: placeholder for future members
  members?: string[];
}

// ============================================================
// PLAN LEVEL (Projects or Events)
// ============================================================

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
  // For event plans: mode is always "event", for project plans: mode is "company"
  mode: "company" | "event";
}

// ============================================================
// PLAN CONTENT TYPES
// ============================================================

export type Mode = "company" | "event";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  team: string;
  monthlyCost: number;
  // Integration point: Each team member can map to a 3D avatar/node
  avatar3DNodeId?: string;
}

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  allocatedBudget: number;
  spentAmount: number;
  // Integration point: Each expense category maps to a 3D object/flow
  object3DId?: string;
}

export type ExpenseCategory =
  | "salaries"
  | "tools"
  | "marketing"
  | "operations"
  | "events";

export type FinancialStatus = "healthy" | "warning" | "risk";

export interface EventData {
  estimatedAttendance: number;
  ticketPrice: number;
  expectedRevenue: number;
  eventExpenses: number;
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
