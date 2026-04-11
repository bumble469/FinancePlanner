"use client";
import { useState, useEffect } from "react";
import { useFinancialStore } from "@/lib/store";
import { authClient } from "@/lib/auth-client";
import { Department } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Users,
  Ticket,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddDeptDialog } from "./components/add-dept-dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { getCurrencySymbol } from "@/lib/currency";
import { DepartmentListView } from "./components/dept-list-view";
import { DepartmentDetailView } from "./components/dept-detail-view";

function formatCurrency(value: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${value.toLocaleString("en-IN")}`;
}

export function EventSection() {
  const { currentPlanId, mode, eventData, updateEventData, expenses, simulation, departments, addDepartment, updateDepartment, removeDepartment,
    modules, addModule, updateModule, removeModule, currency
  } = useFinancialStore();
  const isEvent = mode === "event";
  const isProject = mode === "project";
  // const metrics = calculateMetrics(expenses, simulation, mode, eventData);
  const eventProfit = eventData.expectedRevenue - eventData.eventBudget * simulation.costMultiplier;
  const isProfit = eventProfit >= 0;

  //dept vars
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null);
  const [confirmDeptOpen, setConfirmDeptOpen] = useState(false);

  const [activeDept, setActiveDept] = useState<Department | null>(null);

  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [confirmModuleOpen, setConfirmModuleOpen] = useState(false);

  const breakEvenAttendees = Math.ceil(
    eventData.eventBudget / eventData.ticketPrice
  );
  const profitPerAttendee = eventData.ticketPrice - eventData.eventBudget / eventData.estimatedAttendance;

  useEffect(() => {
    fetchDepartments();
  }, [currentPlanId])

  const fetchDepartments = async () => {
    if (!currentPlanId) return;

    try {
      const res = await authClient.request(
        `/api/plan/${currentPlanId}/departments`
      );
      const data = res.data;
      useFinancialStore.getState().setDepartments(
        data.map((d: any) => ({ ...d, budget: Number(d.budget) }))
      );

    } catch (err) {
      console.error("Fetch departments failed:", err);
    }
  };

  const createDepartment = async (
    id: string,
    name: string,
    budget: number
  ) => {
    if (!currentPlanId) return;

    const tempDept = { id, name, budget };
    const newDept = { name, budget };

    addDepartment(tempDept);

    try {
      await authClient.request(
        `/api/plan/${currentPlanId}/departments`,
        {
          method: "POST",
          data: newDept,
        }
      );
    } catch (err) {
      console.error("Create department failed:", err);
      removeDepartment(id);
    }
  };

  const updateDepartmentHandler = async (
    id: string,
    data: Partial<{ name: string; budget: number }>
  ) => {
    if (!currentPlanId) return;

    updateDepartment(id, data);

    try {
      await authClient.request(
        `/api/plan/${currentPlanId}/departments/${id}`,
        {
          method: "PATCH",
          data
        }
      );
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const deleteDepartmentHandler = async (id: string) => {
    if (!currentPlanId) return;

    removeDepartment(id);

    try {
      await authClient.request(
        `/api/plan/${currentPlanId}/departments/${id}`,
        { method: "DELETE" }
      );
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const remainingBudget = (eventData.eventBudget || 0) - departments
    .filter((d) => d.id !== editingDept?.id)
    .reduce((sum, d) => sum + Number(d.budget || 0), 0);


  useEffect(() => {
    if (activeDept) {
      fetchPhases(activeDept.id);
    }
  }, [activeDept]);

  // api calls for phases(modules)
  const fetchPhases = async (deptId: string) => {
    if (!currentPlanId) return;
    try {
      const res = await authClient.request(
        `/api/plan/${currentPlanId}/departments/${deptId}/phases`
      );
      useFinancialStore.getState().setModules(
        res.data.map((p: any) => ({ ...p }))
      );
    } catch (err) {
      console.error("Fetch phases failed:", err);
    }
  };

  const createPhase = async (deptId: string, name: string) => {
    if (!currentPlanId) return;

    const tempId = crypto.randomUUID();
    const optimistic = { id: tempId, name, departmentId: deptId };

    addModule(optimistic);

    try {
      const res = await authClient.request(
        `/api/plan/${currentPlanId}/departments/${deptId}/phases`,
        {
          method: "POST",
          data: { name },
        }
      );
      useFinancialStore.getState().updateModule(tempId, res.data.id);
    } catch (err) {
      console.error("Create phase failed:", err);
      removeModule(tempId);
    }
  };

  const updatePhaseHandler = async (
    deptId: string,
    phaseId: string,
    data: Partial<{ name: string; startDate: string; endDate: string }>
  ) => {
    if (!currentPlanId) return;

    updateModule(phaseId, data);

    try {
      await authClient.request(
        `/api/plan/${currentPlanId}/departments/${deptId}/phases/${phaseId}`,
        {
          method: "PATCH",
          data,
        }
      );
    } catch (err) {
      console.error("Update phase failed:", err);
    }
  };

  const deletePhaseHandler = async (phaseId: string) => {
    if (!currentPlanId || !activeDept) return;
    removeModule(phaseId);
    try {
      await authClient.request(
        `/api/plan/${currentPlanId}/departments/${activeDept.id}/phases/${phaseId}`,
        { method: "DELETE" }
      );
    } catch (err) {
      console.error("Delete phase failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Event Planning</h1>
          <p className="mt-1 text-muted-foreground">
            Plan your event finances and calculate expected outcomes
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Event Configuration */}
        <div className="space-y-6 lg:col-span-2">
          {/* Departments */}
          <div className="rounded-xl border p-6">

            {/* Panel header — hide add button when drilled in */}
            <div
              className={`flex items-center justify-between ${
                activeDept ? "" : "mb-4"
              }`}
            >
              {!activeDept && <h2 className="font-semibold">Departments</h2>}

              {!activeDept && (
                <>
                  <AddDeptDialog
                    onCreate={createDepartment}
                    onUpdate={(id, name, budget) =>
                      updateDepartmentHandler(id, { name, budget })
                    }
                    onDeptCreated={fetchDepartments}
                    maxBudget={remainingBudget}
                    editingDept={editingDept}
                    open={deptDialogOpen}
                    setOpen={(v) => {
                      setDeptDialogOpen(v);
                      if (!v) setEditingDept(null);
                    }}
                  />
                  <ConfirmDeleteDialog
                    open={confirmDeptOpen}
                    type={"department"}
                    setOpen={setConfirmDeptOpen}
                    onConfirm={() => {
                      if (deleteDeptId) {
                        deleteDepartmentHandler(deleteDeptId);
                        setDeleteDeptId(null);
                      }
                    }}
                  />
                </>
              )}

              {/* Module confirm delete — always mounted */}
              <ConfirmDeleteDialog
                open={confirmModuleOpen}
                type={"module"}
                setOpen={setConfirmModuleOpen}
                onConfirm={() => {
                  if (deleteModuleId) {
                    deletePhaseHandler(deleteModuleId);
                    setDeleteModuleId(null);
                  }
                }}
              />
            </div>

            {/* Conditional view */}
            {activeDept ? (
              <DepartmentDetailView
                dept={activeDept}
                modules={modules}
                currency={currency}
                onBack={() => setActiveDept(null)}
                onAddModule={(name) => createPhase(activeDept.id, name)}
                onEditModule={(module, name) =>
                  updatePhaseHandler(activeDept.id, module.id, { name })
                }
                onDeleteModule={(id) => {
                  setDeleteModuleId(id);
                  setConfirmModuleOpen(true);
                }}
              />
            ) : (
              <DepartmentListView
                departments={departments}
                currency={currency}
                isProject={isProject}
                onEdit={(d) => {
                  setEditingDept(d);
                  setDeptDialogOpen(true);
                }}
                onDelete={(id) => {
                  setDeleteDeptId(id);
                  setConfirmDeptOpen(true);
                }}
                onDrillDown={(d) => setActiveDept(d)}
              />
            )}
          </div>

          {/* Attendance & Tickets */}
          {isEvent && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-6 flex items-center gap-2 font-semibold text-foreground">
                <Users className="h-5 w-5 text-primary" />
                Attendance & Tickets
              </h2>

              <div className="space-y-6">
                {/* Estimated Attendance */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Estimated Attendance</Label>
                    <span className="font-mono text-lg font-medium text-foreground">
                      {eventData.estimatedAttendance.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[eventData.estimatedAttendance]}
                    onValueChange={([v]) =>
                      updateEventData({
                        estimatedAttendance: v,
                        expectedRevenue: v * eventData.ticketPrice,
                      })
                    }
                    min={50}
                    max={5000}
                    step={50}
                    className="py-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Drag to adjust expected number of attendees
                  </p>
                </div>

                {/* Ticket Price */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Ticket Price</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={eventData.ticketPrice}
                        onChange={(e) =>
                          updateEventData({
                            ticketPrice: Number(e.target.value),
                            expectedRevenue:
                              eventData.estimatedAttendance * Number(e.target.value),
                          })
                        }
                        className="h-9 w-24 text-right font-mono"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[eventData.ticketPrice]}
                    onValueChange={([v]) =>
                      updateEventData({
                        ticketPrice: v,
                        expectedRevenue: eventData.estimatedAttendance * v,
                      })
                    }
                    min={10}
                    max={500}
                    step={5}
                    className="py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Event Expenses */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 flex items-center gap-2 font-semibold text-foreground">
              <DollarSign className="h-5 w-5 text-primary" />
              Event Expenses
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Total Event Expenses</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={eventData.eventBudget}
                      onChange={(e) =>
                        updateEventData({ eventBudget: Number(e.target.value) })
                      }
                      className="h-9 w-32 text-right font-mono"
                    />
                  </div>
                </div>
                <Slider
                  value={[eventData.eventBudget]}
                  onValueChange={([v]) => updateEventData({ eventBudget: v })}
                  min={1000}
                  max={100000}
                  step={500}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">
                  Includes venue, catering, equipment, marketing, etc.
                </p>
              </div>

              {/* Expense breakdown suggestions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground">Venue (est.)</p>
                  <p className="font-mono text-sm text-foreground">
                    {formatCurrency(eventData.eventBudget * 0.35, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground">Catering (est.)</p>
                  <p className="font-mono text-sm text-foreground">
                    {formatCurrency(eventData.eventBudget * 0.25, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground">Marketing (est.)</p>
                  <p className="font-mono text-sm text-foreground">
                    {formatCurrency(eventData.eventBudget * 0.2, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground">Other (est.)</p>
                  <p className="font-mono text-sm text-foreground">
                    {formatCurrency(eventData.eventBudget * 0.2, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Outcome */}
        <div className="space-y-4">
          {/* Revenue Card */}
          <div className="rounded-xl border border-success/30 bg-success/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
                <Ticket className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Revenue</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(eventData.expectedRevenue, currency)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {eventData.estimatedAttendance.toLocaleString()} attendees ×{" "}
              {formatCurrency(eventData.ticketPrice, currency)}
            </p>
          </div>

          {/* Expenses Card */}
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Event Expenses</p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(eventData.eventBudget, currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Visual */}
          <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
            <span className="text-success">{formatCurrency(eventData.expectedRevenue, currency)}</span>
            <ArrowRight className="h-4 w-4" />
            <span className="text-warning">-{formatCurrency(eventData.eventBudget, currency)}</span>
          </div>

          {/* Profit/Loss Card */}
          <div
            className={cn(
              "rounded-xl border p-5",
              isProfit
                ? "border-success/30 bg-success/5"
                : "border-danger/30 bg-danger/5"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  isProfit ? "bg-success/20" : "bg-danger/20"
                )}
              >
                {isProfit ? (
                  <TrendingUp className={cn("h-5 w-5", "text-success")} />
                ) : (
                  <TrendingDown className={cn("h-5 w-5", "text-danger")} />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isProfit ? "Expected Profit" : "Expected Loss"}
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    isProfit ? "text-success" : "text-danger"
                  )}
                >
                  {formatCurrency(Math.abs(eventProfit), currency)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {isProfit ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-danger" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isProfit ? "text-success" : "text-danger"
                )}
              >
                {isProfit ? "Profitable Event" : "Loss Expected"}
              </span>
            </div>
          </div>

          {/* Break-even Analysis */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Calculator className="h-4 w-4 text-primary" />
              Break-even Analysis
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Break-even Point</span>
                <span className="font-mono font-medium text-foreground">
                  {breakEvenAttendees.toLocaleString()} attendees
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Profit per Attendee</span>
                <span
                  className={cn(
                    "font-mono font-medium",
                    profitPerAttendee >= 0 ? "text-success" : "text-danger"
                  )}
                >
                  {formatCurrency(profitPerAttendee, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Safety Margin</span>
                <span
                  className={cn(
                    "font-mono font-medium",
                    eventData.estimatedAttendance > breakEvenAttendees
                      ? "text-success"
                      : "text-danger"
                  )}
                >
                  {eventData.estimatedAttendance - breakEvenAttendees} attendees
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
