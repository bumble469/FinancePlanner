import { TopNav } from "@/components/layout/top-nav";
import { ConnectionsPage } from "@/components/connections/connections-page";

export const metadata = {
  title: "Plans - FinanceFlow",
  description: "Manage and view all your financial plans",
};

export default function ConnectionsPageRoute() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <ConnectionsPage />
      </main>
    </div>
  );
}