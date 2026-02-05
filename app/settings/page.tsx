import { TopNav } from "@/components/layout/top-nav";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Settings - FinanceFlow",
  description: "Manage account settings",
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>

          {/* Settings Sections */}
          <div className="grid gap-6">
            {/* Account Settings */}
            <Card className="border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Account Settings
              </h2>
              <p className="text-muted-foreground mb-4">
                Account management features will appear here.
              </p>
              <p className="text-sm text-muted-foreground italic">
                Future features:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                <li>Change account type (Individual/Company)</li>
                <li>Update account name</li>
                <li>Manage team members (Company accounts)</li>
              </ul>
            </Card>

            {/* Preferences */}
            <Card className="border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Preferences
              </h2>
              <p className="text-muted-foreground mb-4">
                Customize your experience.
              </p>
              <p className="text-sm text-muted-foreground italic">
                Future features:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                <li>Theme selection (light/dark)</li>
                <li>Currency preference</li>
                <li>Notification settings</li>
              </ul>
            </Card>

            {/* Architecture Info */}
            <Card className="border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                About This Dashboard
              </h2>
              <p className="text-muted-foreground mb-3">
                This financial management dashboard uses a hierarchical, multi-plan architecture:
              </p>
              <div className="space-y-2 text-sm text-muted-foreground font-mono">
                <p>Account (Individual or Company)</p>
                <p className="ml-4">└── Plans (Projects or Events)</p>
                <p className="ml-8">├── Team Members</p>
                <p className="ml-8">├── Expenses</p>
                <p className="ml-8">├── Event Data (if Event type)</p>
                <p className="ml-8">└── Simulation State</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
