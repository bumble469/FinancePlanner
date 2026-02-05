# FinanceFlow - Multi-Plan Implementation Guide

## What Changed

The single-dashboard financial app has been restructured into a **multi-plan hierarchy system** where one account can create and manage multiple financial plans (projects or events).

### Before (Single Plan)
```
App
└── DashboardLayout (shows one finance dashboard)
```

### After (Multi-Plan)
```
App
├── / (Overview page - aggregates all plans)
├── /plans (Plans list page)
├── /plans/[planId] (Individual plan dashboard)
└── /settings (Account settings)
```

## Key Components Created

### 1. Account-Level Pages

#### `/` - Overview Page
- **Component**: `OverviewPage` (`/components/overview/overview-page.tsx`)
- **Shows**: Aggregated metrics from all plans
- **Links**: To individual plan dashboards
- **Data**: `totalBudget`, `totalSpent`, `totalRemaining` (sum of all plans)

#### `/plans` - Plans List Page
- **Component**: `PlansPage` (`/components/plans/plans-page.tsx`)
- **Shows**: All plans (active + completed) in grid format
- **Features**: Create plan button, delete plan, view dashboard links
- **Cards**: `PlanCard` showing budget, spent, remaining, status

#### `/settings` - Settings Page
- **Placeholder** for future account settings
- **Shows**: Architecture documentation reference

#### `TopNav` - Global Navigation
- **Component**: `TopNav` (`/components/layout/top-nav.tsx`)
- **Routes**: Overview, Plans, Settings
- **Hidden**: On plan dashboard pages

### 2. Plan-Level Dashboard

#### `/plans/[planId]` - Plan Dashboard
- **Component**: `DashboardLayout` (`/components/dashboard/dashboard-layout.tsx`)
- **Props**: `planId` from URL parameter
- **Behavior**: 
  - Loads plan from store on mount
  - Syncs plan data to dashboard store
  - Shows plan-specific sections in sidebar
  - Back button to return to plans list

### 3. Support Components

#### Create Plan Dialog
- **Component**: `CreatePlanDialog` (`/components/plans/create-plan-dialog.tsx`)
- **Form Fields**: Name, Type (Project/Event), Budget
- **Action**: Calls `addPlan()` in store

#### Plan Card
- **Component**: `PlanCard` (`/components/plans/plan-card.tsx`)
- **Shows**: Plan summary with metrics
- **Colors**: Status indicators (green/yellow/red)
- **Actions**: View dashboard, delete plan

## Data Flow Examples

### Example 1: User Creates a New Plan

```
User clicks "+ Create Plan" button
  → CreatePlanDialog opens
  → User enters name, type, budget
  → Form calls store.addPlan(name, type, budget)
  → Store creates new Plan object with empty arrays
  → PlansPage re-renders with new plan in list
```

### Example 2: User Opens Plan Dashboard

```
User clicks "View Dashboard" on plan card
  → Browser navigates to /plans/[planId]
  → DashboardLayout component mounts
  → Receives planId as prop
  → Calls syncToPlan(planId, plan)
  → Store loads plan data: teamMembers, expenses, etc.
  → Dashboard sections render with plan data
  → Sidebar shows current plan name
```

### Example 3: User Adds Expense to Plan

```
In dashboard expense section
  → User clicks "Add Expense"
  → Form calls store.addExpense(expenseData)
  → Store adds expense to current plan
  → Plan total spent is recalculated
  → Dashboard metric cards update
  → Plan card on /plans also shows updated spent amount
```

### Example 4: User Goes Back to Overview

```
User clicks plan name in breadcrumb or uses browser back
  → Navigates to /plans
  → PlansPage component fetches all plans from store
  → Shows updated metrics for each plan
  → User can then navigate to / for global overview
```

## Store Structure

### `useFinancialStore` Manages

#### Account Level
- `account`: Current user account (name, type)
- `plans[]`: All plans for account
- `currentPlanId`: Which plan is currently being viewed
- Methods: `addPlan`, `removePlan`, `updatePlanStatus`, `setCurrentPlanId`

#### Plan Dashboard Level (applies to currently selected plan)
- `teamMembers[]`: Team for current plan
- `expenses[]`: Expenses for current plan
- `eventData`: Event data (if event plan)
- `simulation`: What-if mode state
- Methods: `addTeamMember`, `updateTeamMember`, `removeTeamMember`, `addExpense`, etc.

#### Sync Method
- `syncToPlan(planId, plan)`: When opening a plan dashboard
  - Loads plan data into dashboard-level store state
  - Sets `currentPlanId`
  - Populates `teamMembers`, `expenses`, `eventData`

## Route Structure

### Public Routes (Account Level)
```
GET  /              (OverviewPage)
GET  /plans         (PlansPage)
GET  /settings      (SettingsPage)
POST /plans         (Create new plan - via dialog)
DELETE /plans/:id   (Delete plan - via card button)
```

### Dynamic Routes (Plan Level)
```
GET  /plans/[planId]  (DashboardLayout with specific plan)
```

## Component Hierarchy

```
RootLayout
├── TopNav (global navigation)
└── Page Content
    ├── OverviewPage (/ route)
    │   ├── MetricCard x4 (total budget, spent, remaining, revenue)
    │   └── PlanCard[] (summary for each plan)
    │
    ├── PlansPage (/plans route)
    │   ├── PlanCard[] (active plans)
    │   ├── PlanCard[] (completed plans)
    │   └── CreatePlanDialog (modal)
    │
    ├── DashboardLayout (/plans/[planId] route)
    │   ├── Sidebar (plan navigation)
    │   └── Section Content
    │       ├── OverviewSection (dashboard metrics)
    │       ├── TeamSection (manage members)
    │       ├── ExpenseSection (track expenses)
    │       ├── EventSection (if event plan)
    │       └── SimulationSection (what-if mode)
    │
    └── SettingsPage (/settings route)
```

## TypeScript Types

### New Account Types
```typescript
type AccountType = "individual" | "company";
type PlanType = "project" | "event";
type PlanStatus = "active" | "completed";

interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: Date;
}

interface Plan {
  id: string;
  accountId: string;
  name: string;
  type: PlanType;
  status: PlanStatus;
  budget: number;
  spent: number;
  teamMembers: TeamMember[];
  expenses: Expense[];
  eventData?: EventData;
  simulation: SimulationModifiers;
  mode: "company" | "event";
}
```

## How to Add Features

### Add a New Plan Section
1. Create component: `/components/dashboard/sections/new-section.tsx`
2. Update `DashboardLayout` switch statement for new section ID
3. Add to sidebar nav items
4. Use `useFinancialStore` to access/modify plan data

### Access Plan Data in Any Component
```typescript
import { useFinancialStore } from "@/lib/store";

export function MyComponent() {
  const { getCurrentPlan, teamMembers, expenses } = useFinancialStore();
  const plan = getCurrentPlan();
  
  // Use data
  return <div>{plan?.name}</div>;
}
```

### Navigate to a Plan
```typescript
import { useRouter } from "next/navigation";

export function NavigateToPlan() {
  const router = useRouter();
  
  const handleClick = (planId: string) => {
    router.push(`/plans/${planId}`);
  };
  
  return <button onClick={() => handleClick("plan-123")}>View Plan</button>;
}
```

### Create Plan From Anywhere
```typescript
import { useFinancialStore } from "@/lib/store";

export function CreateButton() {
  const { addPlan } = useFinancialStore();
  
  const handleCreate = () => {
    addPlan("My New Plan", "project", 50000);
  };
  
  return <button onClick={handleCreate}>Create Plan</button>;
}
```

## State Synchronization Notes

### Auto-Sync During Navigation
- When user navigates to `/plans/[planId]`, `DashboardLayout` automatically calls `syncToPlan()`
- This loads the plan data into dashboard-scoped state
- When modifying data (add expense, etc.), the plan in the `plans[]` array is updated

### Plan Persistence
- Currently uses client-side Zustand store (no backend)
- Data persists during session but lost on page refresh
- Ready for backend integration via API calls

### Multi-Tab Behavior (Current)
- Each tab/window has independent state
- Changes in one tab won't reflect in another
- Future: Add localStorage sync or WebSocket updates

## Known Limitations

1. **No Real Authentication**: Uses mock account
2. **No Backend Storage**: Data lost on refresh
3. **Single User Only**: No multi-user support yet
4. **No Plan Sharing**: Plans are account-specific
5. **No Real-time Sync**: Changes don't sync across devices

## Future Enhancements

### Phase 1: Backend
- Add database (Neon/Supabase/MongoDB)
- Implement authentication (Auth.js)
- Add API routes for CRUD operations
- Data persistence

### Phase 2: Collaboration
- Multi-user support
- Plan sharing and permissions
- Real-time collaboration
- Comments and activity log

### Phase 3: Advanced Features
- 3D visualizations (Spline integration)
- Analytics and forecasting
- Budget recommendations
- Export/reporting
- Team member roles and permissions

### Phase 4: Mobile & PWA
- React Native app
- PWA capabilities
- Offline support
- Mobile-optimized UI

---

**Current Status**: Multi-plan architecture implemented with placeholder data. Ready for incremental backend integration.
