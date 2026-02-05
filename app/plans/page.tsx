import { PlansPage } from "@/components/plans/plans-page";
import { TopNav } from "@/components/layout/top-nav";

export const metadata = {
  title: "Plans - FinanceFlow",
  description: "Manage and view all your financial plans",
};

export default function PlansPageRoute() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PlansPage />
      </main>
    </div>
  );
}
