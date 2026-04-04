'use client';

import { useEffect, useState } from 'react';

import { TopNav } from "@/components/layout/top-nav";
import { OverviewPage } from "@/components/overview/overview-page";
import { authClient } from '@/lib/auth-client';
import { useSnackbar } from '@/lib/useSnackbar';

import { LandingHeader } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { CTASection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/footer";
import { Snackbar } from '@/components/ui/snackbar-main';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const snackbar = useSnackbar();

  useEffect(() => {
    async function checkAuth() {
      try {
        let res = await authClient.fetch('/api/auth/me');

        if (res.status === 401) {
          const refreshRes = await authClient.fetch('/api/auth/refresh', {
            method: 'POST',
          });

          if (refreshRes.ok) {
            res = await authClient.fetch('/api/auth/me');
          } else {
            snackbar.show('Session expired. Please login again.');
            setIsAuthenticated(false);
            return;
          }
        }

        if (res.ok) {
          const json = await res.json();
          authClient.setUser(json.data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
    }

    checkAuth();
  }, []);

  return (
    <>
      <Snackbar />

      {isAuthenticated ? (
        <div className="min-h-screen bg-background">
          <TopNav />
          <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <OverviewPage />
          </main>
        </div>
      ) : (
        <div className="min-h-screen bg-background">
          <LandingHeader />
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <CTASection />
          <LandingFooter />
        </div>
      )}
    </>
  );
}