"use client";

import { useState } from "react";
import { useFinancialStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Wrench,
  Megaphone,
  Building2,
  PartyPopper,
  Box,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { Expense, ExpenseCategory, FinancialStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryConfig: Record<
  ExpenseCategory,
  { label: string; icon: typeof Users; color: string }
> = {
  salaries: { label: "Salaries", icon: Users, color: "bg-chart-1" },
  tools: { label: "Tools", icon: Wrench, color: "bg-chart-2" },
  marketing: { label: "Marketing", icon: Megaphone, color: "bg-chart-3" },
  operations: { label: "Operations", icon: Building2, color: "bg-chart-4" },
  events: { label: "Events", icon: PartyPopper, color: "bg-chart-5" },
};

const categories: ExpenseCategory[] = [
  "salaries",
  "tools",
  "marketing",
  "operations",
  "events",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function getExpenseStatus(spent: number, budget: number): FinancialStatus {
  const ratio = spent / budget;
  if (ratio <= 0.7) return "healthy";
  if (ratio <= 1) return "warning";
  return "risk";
}

export function ExpenseSection() {
  const { expenses, addExpense, updateExpense, removeExpense } =
    useFinancialStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "" as ExpenseCategory | "",
    allocatedBudget: "",
    spentAmount: "",
  });

  const totalBudget = expenses.reduce((sum, e) => sum + e.allocatedBudget, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.spentAmount, 0);
  const overBudgetCount = expenses.filter(
    (e) => e.spentAmount > e.allocatedBudget
  ).length;

  const handleSubmit = () => {
    if (
      !formData.name ||
      !formData.category ||
      !formData.allocatedBudget ||
      !formData.spentAmount
    )
      return;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        name: formData.name,
        category: formData.category as ExpenseCategory,
        allocatedBudget: Number(formData.allocatedBudget),
        spentAmount: Number(formData.spentAmount),
      });
      setEditingExpense(null);
    } else {
      addExpense({
        name: formData.name,
        category: formData.category as ExpenseCategory,
        allocatedBudget: Number(formData.allocatedBudget),
        spentAmount: Number(formData.spentAmount),
      });
    }

    setFormData({ name: "", category: "", allocatedBudget: "", spentAmount: "" });
    setIsAddOpen(false);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      category: expense.category,
      allocatedBudget: expense.allocatedBudget.toString(),
      spentAmount: expense.spentAmount.toString(),
    });
    setIsAddOpen(true);
  };

  const handleClose = () => {
    setIsAddOpen(false);
    setEditingExpense(null);
    setFormData({ name: "", category: "", allocatedBudget: "", spentAmount: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense Tracking</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor and manage expenses by category
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Edit Expense" : "Add Expense"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Expense Name</Label>
                <Input
                  id="name"
                  placeholder="Enter expense name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v as ExpenseCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryConfig[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Allocated Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="Enter allocated budget"
                  value={formData.allocatedBudget}
                  onChange={(e) =>
                    setFormData({ ...formData, allocatedBudget: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spent">Spent Amount ($)</Label>
                <Input
                  id="spent"
                  type="number"
                  placeholder="Enter spent amount"
                  value={formData.spentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, spentAmount: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingExpense ? "Update" : "Add"} Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Budget</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {formatCurrency(totalBudget)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-warning">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold",
              totalBudget - totalSpent >= 0 ? "text-success" : "text-danger"
            )}
          >
            {formatCurrency(totalBudget - totalSpent)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Over Budget</p>
          <div className="mt-1 flex items-center gap-2">
            <p
              className={cn(
                "text-2xl font-bold",
                overBudgetCount > 0 ? "text-danger" : "text-success"
              )}
            >
              {overBudgetCount}
            </p>
            <span className="text-sm text-muted-foreground">
              / {expenses.length} categories
            </span>
          </div>
        </div>
      </div>

      {/* Expense Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {expenses.map((expense) => {
          const config = categoryConfig[expense.category];
          const Icon = config.icon;
          const status = getExpenseStatus(
            expense.spentAmount,
            expense.allocatedBudget
          );
          const percentage = Math.min(
            (expense.spentAmount / expense.allocatedBudget) * 100,
            100
          );
          const isOverBudget = expense.spentAmount > expense.allocatedBudget;

          return (
            <div
              key={expense.id}
              className={cn(
                "relative rounded-xl border bg-card p-5 transition-all",
                status === "healthy" && "border-success/30",
                status === "warning" && "border-warning/30",
                status === "risk" && "border-danger/30"
              )}
            >
              {/* Integration point note */}
              <div className="absolute -top-2 right-12 flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                <Box className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">3D Object</span>
              </div>

              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      config.color,
                      "bg-opacity-20"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", `text-${config.color.replace('bg-', '')}`)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{expense.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {config.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(expense)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeExpense(expense.id)}
                    className="h-8 w-8 text-danger hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Budget Info */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Allocated</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatCurrency(expense.allocatedBudget)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      isOverBudget ? "text-danger" : "text-foreground"
                    )}
                  >
                    {formatCurrency(expense.spentAmount)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <Progress
                    value={percentage}
                    className={cn(
                      "h-2",
                      status === "healthy" && "[&>div]:bg-success",
                      status === "warning" && "[&>div]:bg-warning",
                      status === "risk" && "[&>div]:bg-danger"
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% used
                    </span>
                    {/* Status Badge */}
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5",
                        status === "healthy" && "bg-success/10 text-success",
                        status === "warning" && "bg-warning/10 text-warning",
                        status === "risk" && "bg-danger/10 text-danger"
                      )}
                    >
                      {status === "risk" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium capitalize">
                        {status === "healthy"
                          ? "On Track"
                          : status === "warning"
                            ? "Warning"
                            : "Over Budget"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
