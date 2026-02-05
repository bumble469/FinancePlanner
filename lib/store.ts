"use client";

import { create } from "zustand";
import type {
  Account,
  Plan,
  TeamMember,
  Expense,
  Mode,
  EventData,
  SimulationModifiers,
  PlanType,
} from "./types";

interface AccountStore {
  account: Account | null;
  setAccount: (account: Account) => void;

  plans: Plan[];
  addPlan: (name: string, type: PlanType, budget: number) => void;
  removePlan: (planId: string) => void;
  updatePlanStatus: (planId: string, status: "active" | "completed") => void;

  currentPlanId: string | null;
  setCurrentPlanId: (planId: string | null) => void;
  getCurrentPlan: () => Plan | null;
}

interface PlanDashboardStore {
  mode: Mode;
  setMode: (mode: Mode) => void;

  teamMembers: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, "id">) => void;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  removeExpense: (id: string) => void;

  eventData: EventData;
  updateEventData: (data: Partial<EventData>) => void;

  simulation: SimulationModifiers;
  updateSimulation: (data: Partial<SimulationModifiers>) => void;
  resetSimulation: () => void;

  syncToPlan: (planId: string, plan: Plan) => void;
}

type FinancialStore = AccountStore & PlanDashboardStore;

const defaultEventData: EventData = {
  estimatedAttendance: 500,
  ticketPrice: 100,
  expectedRevenue: 50000,
  eventExpenses: 25000,
};

const defaultSimulation: SimulationModifiers = {
  costMultiplier: 1,
  additionalMembers: 0,
  revenueAdjustment: 0,
  isSimulating: false,
};

const createDefaultTeamMembers = (): TeamMember[] => [
  { id: "1", name: "Alex Chen", role: "CEO", team: "Leadership", monthlyCost: 15000 },
  { id: "2", name: "Sarah Johnson", role: "CTO", team: "Leadership", monthlyCost: 14000 },
  { id: "3", name: "Mike Rodriguez", role: "Senior Developer", team: "Engineering", monthlyCost: 10000 },
  { id: "4", name: "Emily Davis", role: "Product Designer", team: "Design", monthlyCost: 8500 },
  { id: "5", name: "James Wilson", role: "Marketing Lead", team: "Marketing", monthlyCost: 9000 },
];

const createDefaultExpenses = (): Expense[] => [
  { id: "1", name: "Salaries", category: "salaries", allocatedBudget: 200000, spentAmount: 168000 },
  { id: "2", name: "Development Tools", category: "tools", allocatedBudget: 15000, spentAmount: 12500 },
  { id: "3", name: "Marketing Campaigns", category: "marketing", allocatedBudget: 50000, spentAmount: 48000 },
  { id: "4", name: "Office & Operations", category: "operations", allocatedBudget: 30000, spentAmount: 22000 },
  { id: "5", name: "Events & Conferences", category: "events", allocatedBudget: 20000, spentAmount: 24000 },
];

const createDefaultAccount = (): Account => ({
  id: "account-1",
  name: "Acme Startup Inc.",
  type: "company",
  createdAt: new Date(),
});

const createDefaultPlans = (accountId: string): Plan[] => [
  {
    id: "plan-1",
    accountId,
    name: "Q1 Operations",
    type: "project",
    status: "active",
    budget: 315000,
    spent: 274500,
    createdAt: new Date(),
    teamMembers: createDefaultTeamMembers(),
    expenses: createDefaultExpenses(),
    simulation: defaultSimulation,
    mode: "company",
  },
  {
    id: "plan-2",
    accountId,
    name: "Annual Tech Conference 2024",
    type: "event",
    status: "active",
    budget: 200000,
    spent: 95000,
    createdAt: new Date(),
    teamMembers: [],
    expenses: [],
    eventData: {
      estimatedAttendance: 1500,
      ticketPrice: 200,
      expectedRevenue: 300000,
      eventExpenses: 95000,
    },
    simulation: defaultSimulation,
    mode: "event",
  },
];

export const useFinancialStore = create<FinancialStore>((set, get) => {
  const account = createDefaultAccount();
  const plans = createDefaultPlans(account.id);
  const initialPlan = plans[0];

  return {
    // ACCOUNT
    account,
    setAccount: (account) => set({ account }),

    plans,
    addPlan: (name, type, budget) =>
      set((state) => ({
        plans: [
          ...state.plans,
          {
            id: crypto.randomUUID(),
            accountId: state.account?.id || "",
            name,
            type,
            status: "active",
            budget,
            spent: 0,
            createdAt: new Date(),
            teamMembers: [],
            expenses: [],
            simulation: defaultSimulation,
            mode: type === "event" ? "event" : "company",
          },
        ],
      })),

    removePlan: (planId) =>
      set((state) => ({
        plans: state.plans.filter((p) => p.id !== planId),
        currentPlanId:
          state.currentPlanId === planId ? null : state.currentPlanId,
      })),

    updatePlanStatus: (planId, status) =>
      set((state) => ({
        plans: state.plans.map((p) =>
          p.id === planId ? { ...p, status } : p
        ),
      })),

    currentPlanId: initialPlan.id,
    setCurrentPlanId: (planId) => set({ currentPlanId: planId }),

    getCurrentPlan: () => {
      const state = get();
      return state.plans.find((p) => p.id === state.currentPlanId) || null;
    },

    // PLAN DASHBOARD
    mode: initialPlan.mode,

    setMode: (mode) =>
      set((state) => {
        if (!state.currentPlanId) return state;
        return {
          mode,
          plans: state.plans.map((p) =>
            p.id === state.currentPlanId ? { ...p, mode } : p
          ),
        };
      }),

    teamMembers: initialPlan.teamMembers,
    expenses: initialPlan.expenses,
    eventData: initialPlan.eventData || defaultEventData,
    simulation: initialPlan.simulation,

    addTeamMember: () => {},
    updateTeamMember: () => {},
    removeTeamMember: () => {},
    addExpense: () => {},
    updateExpense: () => {},
    removeExpense: () => {},

    updateEventData: (data) =>
      set((state) => {
        const eventData = { ...state.eventData, ...data };
        return {
          eventData,
          plans: state.plans.map((p) =>
            p.id === state.currentPlanId ? { ...p, eventData } : p
          ),
        };
      }),

    updateSimulation: (data) =>
      set((state) => {
        const simulation = { ...state.simulation, ...data };
        return {
          simulation,
          plans: state.plans.map((p) =>
            p.id === state.currentPlanId ? { ...p, simulation } : p
          ),
        };
      }),

    resetSimulation: () =>
      set((state) => ({
        simulation: defaultSimulation,
        plans: state.plans.map((p) =>
          p.id === state.currentPlanId
            ? { ...p, simulation: defaultSimulation }
            : p
        ),
      })),

    syncToPlan: (planId, plan) =>
      set({
        currentPlanId: planId,
        mode: plan.mode,
        teamMembers: plan.teamMembers,
        expenses: plan.expenses,
        eventData: plan.eventData || defaultEventData,
        simulation: plan.simulation,
      }),
  };
});

export function calculateMetrics(
  expenses: Expense[],
  simulation: SimulationModifiers,
  mode: Mode,
  eventData: EventData
) {
  const totalBudget = expenses.reduce((s, e) => s + e.allocatedBudget, 0);
  let totalSpent =
    expenses.reduce((s, e) => s + e.spentAmount, 0) *
    simulation.costMultiplier;

  totalSpent += simulation.additionalMembers * 8000;

  let estimatedProfitLoss = totalBudget - totalSpent;

  if (mode === "event") {
    estimatedProfitLoss =
      eventData.expectedRevenue +
      simulation.revenueAdjustment -
      eventData.eventExpenses * simulation.costMultiplier;
  }

  return {
    totalBudget,
    totalSpent,
    remainingBalance: totalBudget - totalSpent,
    estimatedProfitLoss,
  };
}
