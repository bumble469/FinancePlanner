# FinanceFlow - Multi-Plan Architecture

## Overview

FinanceFlow has been restructured from a single-dashboard app into a **hierarchical, multi-plan financial management system**. A single account can now create and manage multiple financial plans (projects or events), each with its own independent dashboard.

## Data Hierarchy

```
Account (Individual or Company)
  ├── name: string
  ├── type: "individual" | "company"
  ├── createdAt: Date
  └── Plans[]
      ├── id: string
      ├── name: string
      ├── type: "project" | "event"
      ├── status: "active" | "completed"
      ├── budget: number
      ├── spent: number (calculated from expenses)
      ├── teamMembers: TeamMember[]
      ├── expenses: Expense[]
      ├── eventData?: EventData (only for event plans)
      └── simulation: SimulationModifiers
```

### Account Types

- **Individual**: Single person managing their own finances
- **Company**: Business or organization (placeholder for future multi-member support)

### Plan Types

- **Project**: Standard business operation with company mode
- **Event**: Event-focused plan with event-specific fields and revenue tracking

## Routing Structure

### Account-Level Routes

| Route | Purpose | Component |
|-------|---------|-----------|
| `/` | Global financial overview (all plans aggregated) | `OverviewPage` |
| `/plans` | List all plans for the account | `PlansPage` |
| `/settings` | Account settings (placeholder) | `SettingsPage` |

### Plan-Level Routes

| Route | Purpose | Component |
|-------|---------|-----------|
| `/plans/[planId]` | Individual plan dashboard | `DashboardLayout` with `PlanId` param |

### Plan Dashboard Sections

Inside `/plans/[planId]`, the sidebar provides access to:

- **Dashboard**: Overview of plan metrics
- **Team & Roles**: Manage team members for this plan
- **Expenses**: Track expenses for this plan
- **Event Planning**: (Only visible for event plans) Event-specific data
- **What-If Mode**: Simulation controls for this plan

## State Management (Zustand Store)

The `useFinancialStore` manages both account-level and plan-level data:

### Account-Level Methods

```typescript
// Account data
account: Account
setAccount: (account: Account) => void

// Plans management
plans: Plan[]
addPlan: (name, type, budget) => void
removePlan: (planId) => void
updatePlanStatus: (planId, status) => void

// Current plan tracking
currentPlanId: string | null
setCurrentPlanId: (planId) => void
getCurrentPlan: () => Plan | null
```

### Plan Dashboard Methods

When a plan is loaded, the store provides methods to modify that plan's data:

```typescript
// Team members (for current plan)
teamMembers: TeamMember[]
addTeamMember: (member) => void
updateTeamMember: (id, member) => void
removeTeamMember: (id) => void

// Expenses (for current plan)
expenses: Expense[]
addExpense: (expense) => void
updateExpense: (id, expense) => void
removeExpense: (id) => void

// Event data (for current plan, if event type)
eventData: EventData
updateEventData: (data) => void

// Simulation (for current plan)
simulation: SimulationModifiers
updateSimulation: (data) => void
resetSimulation: () => void

// Sync a plan to dashboard
syncToPlan: (planId, plan) => void
```

### Data Flow Example

1. User clicks "View Dashboard" on a plan card
2. URL changes to `/plans/[planId]`
3. `DashboardLayout` component mounts with `planId` prop
4. Component calls `syncToPlan(planId, plan)` to load plan data into dashboard store
5. Dashboard sections read from `teamMembers`, `expenses`, `eventData`, etc.
6. User makes changes (e.g., adds expense)
7. Store automatically updates the plan in `plans[]` array
8. Navigating back to `/plans` shows updated metrics

## Component Structure

### Account-Level Components

- **`TopNav`** (`/components/layout/top-nav.tsx`)
  - Global navigation: Overview, Plans, Settings
  - Hidden on plan dashboard pages

- **`OverviewPage`** (`/components/overview/overview-page.tsx`)
  - Aggregates metrics from all plans
  - Displays plan summary cards
  - Links to individual plan dashboards

- **`PlansPage`** (`/components/plans/plans-page.tsx`)
  - Lists all active and completed plans
  - Shows key metrics per plan
  - Links to create plan dialog

- **`PlanCard`** (`/components/plans/plan-card.tsx`)
  - Summary card for individual plan
  - Shows budget, spent, remaining, status
  - Delete and view dashboard buttons

- **`CreatePlanDialog`** (`/components/plans/create-plan-dialog.tsx`)
  - Form to create new plan
  - Collects: name, type (project/event), budget

### Plan Dashboard Components

- **`DashboardLayout`** (`/components/dashboard/dashboard-layout.tsx`)
  - Plan-scoped dashboard layout
  - Loads specific plan on mount
  - Renders sidebar + section content
  - Mobile-responsive with back button

- **`Sidebar`** (`/components/dashboard/sidebar.tsx`)
  - Plan navigation (Dashboard, Team, Expenses, Event, Simulation)
  - Shows current plan name
  - Mode toggle (if applicable)

- **Plan Sections** (`/components/dashboard/sections/`)
  - `overview-section.tsx`: Plan metrics
  - `team-section.tsx`: Team member management
  - `expense-section.tsx`: Expense tracking
  - `event-section.tsx`: Event-specific data (if event plan)
  - `simulation-section.tsx`: What-if mode

## Key Features

### 1. Multiple Plans Per Account

- Create unlimited plans
- Each plan is independent with its own data
- Switch between plans seamlessly

### 2. Plan Types

- **Project Mode**: Standard business operations
  - Team members with monthly costs
  - Operational expenses
  - Budget tracking
  
- **Event Mode**: Event planning with revenue
  - Attendance and ticket pricing
  - Expected revenue calculation
  - Break-even analysis

### 3. Simulation/What-If Mode

- Cost multipliers: "What if costs increased by 1.5x?"
- Additional team members: "What if we hired 2 more people?"
- Revenue adjustments (event mode): "What if ticket sales increase?"
- Side-by-side comparison with actual metrics

### 4. Financial Status Indicators

- **Green (Healthy)**: < 75% budget spent
- **Yellow (Warning)**: 75-90% budget spent
- **Red (Risk)**: > 90% budget spent or over budget

## Future Extensibility

The architecture is designed for future enhancements:

### 3D Visualization Layer

Each component has placeholder markers for Spline 3D integration:
- Team members → 3D avatars/nodes
- Expenses → 3D flow objects
- Plans → 3D scene composition

### Multi-Member Company Support

- Account-level team management
- Permission/role system
- Plan assignment to team members
- Collaborative editing

### Backend Integration

- User authentication (Auth.js, Supabase, etc.)
- Database persistence (Neon, Supabase, etc.)
- Real-time collaboration
- Audit logs

### Advanced Analytics

- Historical trend analysis
- Forecasting algorithms
- Budget recommendations
- Export/reporting

## Local State Management

Currently, all data is stored in client-side Zustand store with default placeholder data. To implement backend:

1. Replace `useFinancialStore` with API calls
2. Add database schema for Account, Plan, TeamMember, Expense
3. Implement authentication
4. Add data validation and authorization

## Development Notes

### Creating a New Plan Section

1. Create component in `/components/dashboard/sections/`
2. Add section ID to `DashboardLayout` switch statement
3. Add navigation item to `Sidebar`
4. Use `useFinancialStore` to read/write plan data

### Accessing Current Plan Data

```typescript
import { useFinancialStore } from "@/lib/store";

export function MyComponent() {
  const { teamMembers, expenses, getCurrentPlan } = useFinancialStore();
  const currentPlan = getCurrentPlan();
  
  // Use data
}
```

### Navigation Between Plans

```typescript
import { useRouter } from "next/navigation";

export function PlanSelector() {
  const router = useRouter();
  
  const handleSelectPlan = (planId: string) => {
    router.push(`/plans/${planId}`);
  };
}
```

---

**Status**: Placeholder data only, no backend implemented. Ready for incremental backend integration.
