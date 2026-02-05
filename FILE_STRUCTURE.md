# FinanceFlow - File Structure

## Overview

This document shows the complete file structure of the multi-plan financial dashboard system.

```
project-root/
├── app/                                 # Next.js App Router
│   ├── layout.tsx                       # Root layout with theme provider
│   ├── page.tsx                         # "/" route - Overview page
│   ├── globals.css                      # Theme variables and global styles
│   ├── plans/
│   │   ├── page.tsx                     # "/plans" route - Plans list page
│   │   └── [planId]/
│   │       └── page.tsx                 # "/plans/[planId]" route - Plan dashboard
│   └── settings/
│       └── page.tsx                     # "/settings" route - Settings page
│
├── components/
│   ├── layout/
│   │   └── top-nav.tsx                  # Global navigation (Overview, Plans, Settings)
│   │
│   ├── overview/
│   │   └── overview-page.tsx            # Account-level overview (aggregates all plans)
│   │
│   ├── plans/
│   │   ├── plans-page.tsx               # Plans list view
│   │   ├── plan-card.tsx                # Individual plan card component
│   │   └── create-plan-dialog.tsx       # New plan creation form
│   │
│   ├── dashboard/
│   │   ├── dashboard-layout.tsx         # Plan-scoped dashboard layout
│   │   ├── sidebar.tsx                  # Plan navigation sidebar
│   │   ├── metric-card.tsx              # Metric display component
│   │   ├── spline-placeholder.tsx       # 3D visualization placeholder
│   │   │
│   │   └── sections/
│   │       ├── overview-section.tsx     # Plan overview/metrics
│   │       ├── team-section.tsx         # Team management
│   │       ├── expense-section.tsx      # Expense tracking
│   │       ├── event-section.tsx        # Event-specific planning
│   │       └── simulation-section.tsx   # What-if mode
│   │
│   ├── theme-provider.tsx               # Next-themes provider
│   │
│   └── ui/                              # Shadcn/UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── switch.tsx
│       ├── label.tsx
│       ├── tabs.tsx
│       ├── slider.tsx
│       ├── table.tsx
│       └── ... (other shadcn components)
│
├── lib/
│   ├── types.ts                         # TypeScript interfaces and types
│   ├── store.ts                         # Zustand store (state management)
│   └── utils.ts                         # Utility functions (cn, etc.)
│
├── ARCHITECTURE.md                      # System architecture documentation
├── IMPLEMENTATION_GUIDE.md              # How to use and extend
├── TRANSFORMATION_CHECKLIST.md          # Completion checklist
├── FILE_STRUCTURE.md                    # This file
│
└── package.json                         # Dependencies
```

## Key Files Explained

### Data Layer

#### `lib/types.ts`
Defines all TypeScript interfaces:
- `Account` - User account (individual or company)
- `Plan` - Financial plan (project or event)
- `TeamMember`, `Expense`, `EventData`, `SimulationModifiers`
- Type enums: `AccountType`, `PlanType`, `PlanStatus`

#### `lib/store.ts`
Zustand store with two layers:
- **Account Level**: Manages plans, current plan selection
- **Plan Dashboard Level**: Manages team, expenses, events, simulation

Key functions:
- `useFinancialStore()` - Main hook to access store
- `calculateMetrics()` - Utility to compute financial metrics

### Routing Layer

#### `app/page.tsx`
- Route: `/`
- Component: `OverviewPage`
- Shows: Aggregated metrics from all plans

#### `app/plans/page.tsx`
- Route: `/plans`
- Component: `PlansPage`
- Shows: List of all plans with create button

#### `app/plans/[planId]/page.tsx`
- Route: `/plans/[planId]`
- Component: `DashboardLayout`
- Shows: Individual plan dashboard

#### `app/settings/page.tsx`
- Route: `/settings`
- Component: Basic settings page (placeholder)

### Account-Level Components

#### `components/layout/top-nav.tsx`
Global navigation bar with links to:
- Overview
- Plans
- Settings

Hidden on plan dashboard pages.

#### `components/overview/overview-page.tsx`
- Aggregates metrics from all plans
- Displays plan summary cards
- Links to individual dashboards

#### `components/plans/plans-page.tsx`
- Lists all plans (active + completed)
- Shows plan metrics
- "+ Create Plan" button

#### `components/plans/plan-card.tsx`
- Summary card for individual plan
- Displays budget, spent, remaining, status
- View dashboard and delete buttons

#### `components/plans/create-plan-dialog.tsx`
- Modal form to create new plan
- Inputs: name, type (project/event), budget
- Calls `store.addPlan()`

### Plan Dashboard Components

#### `components/dashboard/dashboard-layout.tsx`
- Main dashboard container for plan
- Loads plan on mount via `syncToPlan()`
- Renders sidebar + section content
- Mobile back button to return to plans

#### `components/dashboard/sidebar.tsx`
- Plan navigation (Dashboard, Team, Expenses, Event, Simulation)
- Shows current plan name and type
- Plan type indicator (Project/Event)

#### `components/dashboard/sections/`
Individual section components:
- `overview-section.tsx` - Plan metrics and visualizations
- `team-section.tsx` - Add/edit/delete team members
- `expense-section.tsx` - Add/edit/delete expenses
- `event-section.tsx` - Event planning (if event plan)
- `simulation-section.tsx` - What-if mode controls

### Styling

#### `app/globals.css`
- Dark fintech theme with CSS variables
- Color tokens: primary, success, warning, danger
- Custom design tokens for financial UI

#### `components/theme-provider.tsx`
- Next-themes integration
- Dark mode by default
- System preference support

## Data Flow Architecture

```
URL Change → Route Handler
    ↓
Page Component (app/*/page.tsx)
    ↓
Feature Component (PlansPage, OverviewPage, DashboardLayout)
    ↓
Sub-components (PlanCard, Sidebar, Sections)
    ↓
useFinancialStore() → Zustand Store
    ↓
State Update → Components Re-render
```

## Component Hierarchy

```
RootLayout
├── ThemeProvider
├── TopNav (global)
└── Page Content
    ├── OverviewPage (/ route)
    │   ├── MetricCard[] x4
    │   └── PlanCard[]
    │
    ├── PlansPage (/plans route)
    │   ├── PlanCard[] (active)
    │   ├── PlanCard[] (completed)
    │   └── CreatePlanDialog
    │
    ├── DashboardLayout (/plans/[planId] route)
    │   ├── Sidebar
    │   ├── OverviewSection
    │   ├── TeamSection
    │   ├── ExpenseSection
    │   ├── EventSection
    │   └── SimulationSection
    │
    └── SettingsPage (/settings route)
```

## State Management

### Store Location: `lib/store.ts`

**Account-Level State:**
- `account: Account` - Current user account
- `plans: Plan[]` - All plans for account
- `currentPlanId: string | null` - Selected plan ID

**Plan Dashboard State (for current plan):**
- `teamMembers: TeamMember[]`
- `expenses: Expense[]`
- `eventData: EventData`
- `simulation: SimulationModifiers`

**Key Methods:**
- Account: `addPlan`, `removePlan`, `updatePlanStatus`, `setCurrentPlanId`
- Dashboard: `addTeamMember`, `addExpense`, `updateEventData`, `updateSimulation`
- Sync: `syncToPlan(planId, plan)`

## File Sizes (Approximate)

```
types.ts              ~100 lines
store.ts              ~400 lines
overview-page.tsx     ~200 lines
plans-page.tsx        ~100 lines
plan-card.tsx         ~150 lines
create-plan-dialog.tsx ~150 lines
dashboard-layout.tsx  ~150 lines
sections/*.tsx        ~100-400 lines each
top-nav.tsx           ~100 lines
```

## Import Patterns

### Access Store
```typescript
import { useFinancialStore } from "@/lib/store";
```

### Use Types
```typescript
import type { Plan, Account, TeamMember } from "@/lib/types";
```

### Use Components
```typescript
import { PlanCard } from "@/components/plans/plan-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
```

### Use Utilities
```typescript
import { cn } from "@/lib/utils";
import { calculateMetrics } from "@/lib/store";
```

## Configuration Files

- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS (empty, uses inline theme in globals.css)
- `package.json` - Dependencies and scripts

## Adding New Features

### 1. New Account-Level Page
- Create: `app/[feature]/page.tsx`
- Create: `components/[feature]/[feature]-page.tsx`
- Update: `components/layout/top-nav.tsx` navigation

### 2. New Plan Dashboard Section
- Create: `components/dashboard/sections/[feature]-section.tsx`
- Update: `components/dashboard/dashboard-layout.tsx` switch statement
- Update: `components/dashboard/sidebar.tsx` nav items

### 3. New Data Type
- Update: `lib/types.ts` with new interface
- Update: `lib/store.ts` with new store methods

---

**Last Updated**: 2/4/2026
**Architecture Version**: Multi-Plan Hierarchy v1.0
**Status**: Complete with placeholder data
