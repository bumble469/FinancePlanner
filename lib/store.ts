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
  setPlans: (plans: Plan[]) => void;
  addPlan: (plan: Plan) => void;
  removePlan: (planId: string) => void;
  updatePlanStatus: (planId: string, status: "active" | "completed") => void;

  currentPlanId: string | null;
  setCurrentPlanId: (planId: string | null) => void;
  getCurrentPlan: () => Plan | null;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

interface PlanDashboardStore {
  mode: Mode;
  setMode: (mode: Mode) => void;

  teamMembers: TeamMember[];
  setTeamMembers: (members: TeamMember[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;

  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  removeExpense: (id: string) => void;

  eventData: EventData | null;
  updateEventData: (data: Partial<EventData>) => void;

  simulation: SimulationModifiers;
  updateSimulation: (data: Partial<SimulationModifiers>) => void;
  resetSimulation: () => void;

  syncToPlan: (planId: string, plan: Plan) => void;
}

type FinancialStore = AccountStore & PlanDashboardStore;

const defaultSimulation: SimulationModifiers = {
  costMultiplier: 1,
  additionalMembers: 0,
  revenueAdjustment: 0,
  isSimulating: false,
};

export const useFinancialStore = create<FinancialStore>((set, get) => ({
  // ACCOUNT
  account: null,
  setAccount: (account) => set({ account }),

  // PLANS
  plans: [],
  setPlans: (plans) => set({ plans }),
  addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
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

  // LOADING / ERROR
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),

  // CURRENT PLAN
  currentPlanId: null,
  setCurrentPlanId: (planId) => set({ currentPlanId: planId }),
  getCurrentPlan: () => {
    const state = get();
    return state.plans.find((p) => p.id === state.currentPlanId) || null;
  },

  // PLAN DASHBOARD
  mode: "company",

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

  // TEAM MEMBERS
  teamMembers: [],
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  addTeamMember: (member) =>
    set((state) => ({ teamMembers: [...state.teamMembers, member] })),
  updateTeamMember: (id, member) =>
    set((state) => ({
      teamMembers: state.teamMembers.map((m) =>
        m.id === id ? { ...m, ...member } : m
      ),
    })),
  removeTeamMember: (id) =>
    set((state) => ({
      teamMembers: state.teamMembers.filter((m) => m.id !== id),
    })),

  // EXPENSES
  expenses: [],
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) =>
    set((state) => ({ expenses: [...state.expenses, expense] })),
  updateExpense: (id, expense) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, ...expense } : e
      ),
    })),
  removeExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    })),

  // EVENT DATA
  eventData: null,
  updateEventData: (data) =>
    set((state) => {
      const eventData = { ...state.eventData, ...data } as EventData;
      return {
        eventData,
        plans: state.plans.map((p) =>
          p.id === state.currentPlanId ? { ...p, eventData } : p
        ),
      };
    }),

  // SIMULATION
  simulation: defaultSimulation,
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

  // SYNC
  syncToPlan: (planId, plan) =>
    set({
      currentPlanId: planId,
      mode: plan.mode,
      teamMembers: plan.teamMembers,
      expenses: plan.expenses,
      eventData: plan.eventData || null,
      simulation: plan.simulation,
    }),
}));

export function calculateMetrics(
  expenses: Expense[],
  simulation: SimulationModifiers,
  mode: Mode,
  eventData: EventData | null
) {
  const totalBudget = expenses.reduce((s, e) => s + e.allocatedBudget, 0);
  let totalSpent =
    expenses.reduce((s, e) => s + e.spentAmount, 0) *
    simulation.costMultiplier;

  totalSpent += simulation.additionalMembers * 8000;

  let estimatedProfitLoss = totalBudget - totalSpent;

  if (mode === "event" && eventData) {
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