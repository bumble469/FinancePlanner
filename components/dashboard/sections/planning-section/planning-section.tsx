"use client";

import { useFinancialStore, calculateMetrics } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
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
import axios from "axios";
import { AddDeptDialog } from "./components/add-dept-dialog";
import { useEffect } from "react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

export function EventSection() {
  const { currentPlanId, mode, eventData, updateEventData, expenses, simulation, departments, addDepartment, updateDepartment, removeDepartment,
    modules, addModule, updateModule, removeModule
  } = useFinancialStore();
  const isEvent = mode === "event";
  const isProject = mode === "project";
  const metrics = calculateMetrics(expenses, simulation, mode, eventData);
  const eventProfit =
    eventData.expectedRevenue - eventData.eventExpenses * simulation.costMultiplier;
  const isProfit = eventProfit >= 0;

  // Calculate break-even
  const breakEvenAttendees = Math.ceil(
    eventData.eventExpenses / eventData.ticketPrice
  );
  const profitPerAttendee = eventData.ticketPrice - eventData.eventExpenses / eventData.estimatedAttendance;

  useEffect(() => {
    fetchDepartments();
  }, [])

  const fetchDepartments = async () => {
    if (!currentPlanId) return;
    try {
      const res = await axios.get(
        `/api/plan/${currentPlanId}/departments`,
        { withCredentials: true }
      );

      // assuming API returns array
      const data = res.data;

      // you probably need a setter in store
      useFinancialStore.getState().setDepartments(data);

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

    const newDept = { id, name, budget };

    addDepartment(newDept);

    try {
      await axios.post(
        `/api/plan/${currentPlanId}/departments`,
        newDept,
        { withCredentials: true }
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
      await axios.patch(
        `/api/plan/${currentPlanId}/departments/${id}`,
        data,
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const deleteDepartmentHandler = async (id: string) => {
    if (!currentPlanId) return;

    removeDepartment(id);

    try {
      await axios.delete(
        `/api/plan/${currentPlanId}/departments/${id}`,
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Delete failed:", err);
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
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Departments</h2>

              <AddDeptDialog onCreate={createDepartment} onDeptCreated={fetchDepartments} maxBudget={eventData.eventExpenses} />
            </div>

            {departments.map((d) => (
              <div key={d.id} className="border p-4 rounded-lg space-y-4">

                {/* TOP ROW */}
                <div className="flex items-center gap-3">
                  <Input
                    value={d.name}
                    onChange={(e) =>
                      updateDepartmentHandler(d.id, { name: e.target.value })
                    }
                    className="flex-1"
                    placeholder="Department name"
                  />

                  <Input
                    type="number"
                    value={d.budget ?? ""}
                    onChange={(e) =>
                      updateDepartmentHandler(d.id, {
                        budget: Number(e.target.value),
                      })
                    }
                    className="w-32"
                    placeholder="Budget"
                  />

                  {/* DELETE BUTTON */}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteDepartmentHandler(d.id)}
                  >
                    ✕
                  </Button>
                </div>

                {/* MODULES */}
                {isProject && (
                  <div className="pl-4 border-l space-y-2">

                    <Button
                      size="sm"
                      onClick={() =>
                        addModule({
                          id: crypto.randomUUID(),
                          name: "New Module",
                          departmentId: d.id,
                        })
                      }
                    >
                      + Module
                    </Button>

                    {modules
                      .filter((m) => m.departmentId === d.id)
                      .map((m) => (
                        <div key={m.id} className="flex gap-2 items-center">
                          <Input
                            value={m.name}
                            onChange={(e) =>
                              updateModule(m.id, { name: e.target.value })
                            }
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeModule(m.id)}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
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
                      value={eventData.eventExpenses}
                      onChange={(e) =>
                        updateEventData({ eventExpenses: Number(e.target.value) })
                      }
                      className="h-9 w-32 text-right font-mono"
                    />
                  </div>
                </div>
                <Slider
                  value={[eventData.eventExpenses]}
                  onValueChange={([v]) => updateEventData({ eventExpenses: v })}
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
                    {formatCurrency(eventData.eventExpenses * 0.35)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground">Catering (est.)</p>
                  <p className="font-mono text-sm text-foreground">
                    {formatCurrency(eventData.eventExpenses * 0.25)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground">Marketing (est.)</p>
                  <p className="font-mono text-sm text-foreground">
                    {formatCurrency(eventData.eventExpenses * 0.2)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground">Other (est.)</p>
                  <p className="font-mono text-sm text-foreground">
                    {formatCurrency(eventData.eventExpenses * 0.2)}
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
                  {formatCurrency(eventData.expectedRevenue)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {eventData.estimatedAttendance.toLocaleString()} attendees ×{" "}
              {formatCurrency(eventData.ticketPrice)}
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
                  {formatCurrency(eventData.eventExpenses)}
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Visual */}
          <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
            <span className="text-success">{formatCurrency(eventData.expectedRevenue)}</span>
            <ArrowRight className="h-4 w-4" />
            <span className="text-warning">-{formatCurrency(eventData.eventExpenses)}</span>
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
                  {formatCurrency(Math.abs(eventProfit))}
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
                  {formatCurrency(profitPerAttendee)}
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
