"use client";

import { useState } from "react";
import { useFinancialStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Wrench,
  Megaphone,
  Building2,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";
import type { Expense, Income, ExpenseCategory, FinancialStatus } from "@/lib/types";
import { AddIncomeDialog } from "./components/add-income-dialog";
import { AddExpenseDialog } from "./components/add-expense-dialog";
import type { PlanPermissions } from "@/lib/permissions";
// import { EditExpenseDialog } from "./components/edit-expense-dialog";
// import { EditIncomeDialog } from "./components/edit-income-dialog";

// ─── config ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; icon: typeof Users; colorClass: string; badgeClass: string }
> = {
  SALARY: { label: "Salary", icon: Users, colorClass: "bg-chart-1/15 text-chart-1", badgeClass: "bg-chart-1/10 text-chart-1" },
  MARKETING: { label: "Marketing", icon: Megaphone, colorClass: "bg-chart-2/15 text-chart-2", badgeClass: "bg-chart-2/10 text-chart-2" },
  TOOLS: { label: "Tools", icon: Wrench, colorClass: "bg-chart-3/15 text-chart-3", badgeClass: "bg-chart-3/10 text-chart-3" },
  OPERATIONS: { label: "Operations", icon: Building2, colorClass: "bg-chart-4/15 text-chart-4", badgeClass: "bg-chart-4/10 text-chart-4" },
  EVENT: { label: "Event", icon: PartyPopper, colorClass: "bg-chart-5/15 text-chart-5", badgeClass: "bg-chart-5/10 text-chart-5" },
  OTHER: { label: "Other", icon: Wallet, colorClass: "bg-muted text-muted-foreground", badgeClass: "bg-muted text-muted-foreground" },
};

const EXPENSE_CATEGORIES = Object.keys(CATEGORY_CONFIG) as ExpenseCategory[];

type Tab = "income" | "expenses" | "breakdown" | "phases";

// ─── helpers ───────────────────────────────────────────────────────────────

function fmt(value: number, currency: string) {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${value.toLocaleString("en-IN")}`;
}

function getStatus(spent: number, budget: number): FinancialStatus {
  const r = spent / budget;
  if (r <= 0.7) return "healthy";
  if (r <= 1) return "warning";
  return "risk";
}

// ─── sub-components ────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", valueClass)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionHeader({
  title,
  onAdd,
  addLabel,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

// ─── Income Tab ────────────────────────────────────────────────────────────

function IncomeTab({
  income,
  currency,
  onAdd,
  onEdit,
  onDelete,
}: {
  income: Income[];
  currency: string;
  onAdd: () => void;
  onEdit: (i: Income) => void;
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | "INVESTMENT" | "REVENUE">("ALL");

  const filtered = income.filter((i) => filter === "ALL" || i.type === filter);

  return (
    <div className="space-y-4">
      <SectionHeader title="Income entries" onAdd={onAdd} addLabel="Add income" />

      {/* filter chips */}
      <div className="flex gap-2">
        {(["ALL", "INVESTMENT", "REVENUE"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 text-xs border transition-colors",
              filter === f
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40"
            )}
          >
            {f === "ALL" ? "All" : f === "INVESTMENT" ? "Investment" : "Revenue"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No income entries yet. Add one to get started.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Phase</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{entry.source || "—"}</p>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      entry.type === "INVESTMENT"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-green-500/10 text-green-600 dark:text-green-400"
                    )}>
                      {entry.type === "INVESTMENT" ? "Investment" : "Revenue"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {entry.phaseName ?? "Overall"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(entry.receivedAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-green-600 dark:text-green-400">
                    +{fmt(entry.amount, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(entry)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Expenses Tab ──────────────────────────────────────────────────────────

function ExpensesTab({
  expenses,
  currency,
  onAdd,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  currency: string;
  onAdd: () => void;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "ALL">("ALL");

  const filtered = expenses.filter(
    (e) => categoryFilter === "ALL" || e.category === categoryFilter
  );

  return (
    <div className="space-y-4">
      <SectionHeader title="Expense entries" onAdd={onAdd} addLabel="Add expense" />

      {/* category filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter("ALL")}
          className={cn(
            "rounded-full px-3 py-1 text-xs border transition-colors",
            categoryFilter === "ALL"
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:border-foreground/40"
          )}
        >
          All
        </button>
        {EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              "rounded-full px-3 py-1 text-xs border transition-colors",
              categoryFilter === cat
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40"
            )}
          >
            {CATEGORY_CONFIG[cat].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No expenses found.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Department</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Phase</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((expense) => {
                const cfg = CATEGORY_CONFIG[expense.category];
                const Icon = cfg.icon;
                return (
                  <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{expense.description || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cfg.badgeClass)}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {expense.departmentName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {expense.phaseName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(expense.occurredAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-destructive">
                      -{fmt(expense.amount, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(expense)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(expense.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Breakdown Tab ─────────────────────────────────────────────────────────

function BreakdownTab({
  expenses,
  currency,
}: {
  expenses: Expense[];
  currency: string;
}) {
  // by category
  const byCategory = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0);
    return { cat, total };
  }).filter((x) => x.total > 0);

  const grandTotal = byCategory.reduce((s, x) => s + x.total, 0);

  // by department
  const deptMap = new Map<string, number>();
  expenses.forEach((e) => {
    if (e.departmentName) {
      deptMap.set(e.departmentName, (deptMap.get(e.departmentName) ?? 0) + e.amount);
    }
  });
  const byDept = Array.from(deptMap.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* By Category */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">By category</h3>
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
          ) : (
            byCategory.map(({ cat, total }) => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", cfg.colorClass)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium">{cfg.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-medium">{fmt(total, currency)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* By Department */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">By department</h3>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {byDept.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No department data yet</p>
          ) : (
            byDept.map(([dept, total]) => {
              const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dept}</span>
                    <div className="text-right">
                      <span className="font-mono font-medium">{fmt(total, currency)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Phase P&L Tab ─────────────────────────────────────────────────────────

function PhasePLTab({
  income,
  expenses,
  currency,
}: {
  income: Income[];
  expenses: Expense[];
  currency: string;
}) {
  // collect all unique phase names
  const phaseNames = Array.from(
    new Set([
      ...income.filter((i) => i.phaseName).map((i) => i.phaseName!),
      ...expenses.filter((e) => e.phaseName).map((e) => e.phaseName!),
    ])
  );

  // overall (no phase)
  const overallIncome = income.filter((i) => !i.phaseName).reduce((s, i) => s + i.amount, 0);
  const overallExpenses = expenses.filter((e) => !e.phaseName).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Phase-wise P&L</h3>

      {/* Overall row */}
      <PLRow
        label="Overall (no phase)"
        incomeTotal={overallIncome}
        expenseTotal={overallExpenses}
        currency={currency}
        highlight
      />

      {phaseNames.length === 0 && overallIncome === 0 && overallExpenses === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No phase data yet.
        </div>
      )}

      {phaseNames.map((phase) => {
        const phaseIncome = income
          .filter((i) => i.phaseName === phase)
          .reduce((s, i) => s + i.amount, 0);
        const phaseExpenses = expenses
          .filter((e) => e.phaseName === phase)
          .reduce((s, e) => s + e.amount, 0);
        return (
          <PLRow
            key={phase}
            label={phase}
            incomeTotal={phaseIncome}
            expenseTotal={phaseExpenses}
            currency={currency}
          />
        );
      })}
    </div>
  );
}

function PLRow({
  label,
  incomeTotal,
  expenseTotal,
  currency,
  highlight,
}: {
  label: string;
  incomeTotal: number;
  expenseTotal: number;
  currency: string;
  highlight?: boolean;
}) {
  const net = incomeTotal - expenseTotal;
  return (
    <div className={cn(
      "rounded-xl border border-border p-4",
      highlight ? "bg-muted/30" : "bg-card"
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-sm">{label}</span>
        <span className={cn(
          "text-sm font-mono font-semibold",
          net >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
        )}>
          {net >= 0 ? "+" : ""}{fmt(net, currency)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          <span className="text-muted-foreground text-xs">Income</span>
          <span className="ml-auto font-mono text-xs font-medium">{fmt(incomeTotal, currency)}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          <span className="text-muted-foreground text-xs">Expenses</span>
          <span className="ml-auto font-mono text-xs font-medium">{fmt(expenseTotal, currency)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ExpenseSection({ planId, permissions }: { planId: string; permissions: PlanPermissions }) {
  const {
    income,
    expenses,
    currency,
    budget,
    removeIncome,
    removeExpense,
  } = useFinancialStore();

  const [activeTab, setActiveTab] = useState<Tab>("income");
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // summary metrics
  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netPL = totalIncome - totalExpenses;
  const budgetUsedPct = budget > 0 ? Math.round((totalExpenses / budget) * 100) : 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "income", label: "Income" },
    { key: "expenses", label: "Expenses" },
    { key: "breakdown", label: "Breakdown" },
    { key: "phases", label: "Phase P&L" },
  ];

  const handleEditIncome = (i: Income) => {
    setEditingIncome(i);
    setIncomeDialogOpen(true);
  };

  const handleEditExpense = (e: Expense) => {
    setEditingExpense(e);
    setExpenseDialogOpen(true);
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await import("@/lib/auth-client").then(({ authClient }) =>
        authClient.request(`/api/plan/${planId}/income/${id}`, { method: "DELETE" })
      );
      removeIncome(id);
    } catch (err) {
      console.error("Failed to delete income:", err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await import("@/lib/auth-client").then(({ authClient }) =>
        authClient.request(`/api/plan/${planId}/expenses/${id}`, { method: "DELETE" })
      );
      removeExpense(id);
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue & Expenses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track income, spending, and profitability across phases and departments
        </p>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total income"
          value={fmt(totalIncome, currency)}
          sub={`${income.length} entries`}
          valueClass="text-green-600 dark:text-green-400"
        />
        <MetricCard
          label="Total expenses"
          value={fmt(totalExpenses, currency)}
          sub={`${expenses.length} entries`}
          valueClass="text-destructive"
        />
        <MetricCard
          label="Net P&L"
          value={(netPL >= 0 ? "+" : "") + fmt(netPL, currency)}
          sub={netPL >= 0 ? "Profitable" : "In deficit"}
          valueClass={netPL >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}
        />
        <MetricCard
          label="Budget used"
          value={`${budgetUsedPct}%`}
          sub={`of ${fmt(budget, currency)} budget`}
          valueClass={
            budgetUsedPct <= 70
              ? "text-foreground"
              : budgetUsedPct <= 100
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-destructive"
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "income" && (
          <IncomeTab
            income={income}
            currency={currency}
            onAdd={() => { setEditingIncome(null); setIncomeDialogOpen(true); }}
            onEdit={handleEditIncome}
            onDelete={handleDeleteIncome}
          />
        )}
        {activeTab === "expenses" && (
          <ExpensesTab
            expenses={expenses}
            currency={currency}
            onAdd={() => { setEditingExpense(null); setExpenseDialogOpen(true); }}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
          />
        )}
        {activeTab === "breakdown" && (
          <BreakdownTab expenses={expenses} currency={currency} />
        )}
        {activeTab === "phases" && (
          <PhasePLTab income={income} expenses={expenses} currency={currency} />
        )}
      </div>

      <AddIncomeDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        editing={editingIncome}
        onClose={() => { setIncomeDialogOpen(false); setEditingIncome(null); }}
        workItemId={planId}
      />

      <AddExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        editing={editingExpense}
        onClose={() => { setExpenseDialogOpen(false); setEditingExpense(null); }}
        workItemId={planId}
      />
    </div>
  );
}
