'use client';

import { useEffect, useState } from 'react';
import { TopNav } from "@/components/layout/top-nav";
import { OverviewPage } from "@/components/overview/overview-page";
import { authClient } from '@/lib/auth-client';

import { LandingHeader } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { CTASection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/footer";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await authClient.fetch('/api/auth/me');

        if (res.ok) {
          const json = await res.json();
          authClient.setUser(json.data);
          setIsAuthenticated(true);
        }
      } catch (err) {
        // not logged in → ignore
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking authentication…
      </div>
    );
  }

  // ✅ LOGGED IN → DASHBOARD
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <OverviewPage />
        </main>
      </div>
    );
  }

  // ✅ NOT LOGGED IN → LANDING PAGE (v0 sections)
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
