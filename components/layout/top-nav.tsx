"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * TopNav - Global navigation for account-level pages
 * 
 * Routes:
 * / (home) -> Overview
 * /plans -> Plans list
 * /settings -> Settings (placeholder)
 */

const NAV_ITEMS = [
  { href: "/", label: "Overview", segment: "/" },
  { href: "/plans", label: "Plans", segment: "/plans" },
  { href: "/settings", label: "Settings", segment: "/settings" },
];

export function TopNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide top nav on plan dashboard pages
  if (pathname.startsWith("/plans/") && !pathname.endsWith("/plans")) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">
              FinanceFlow
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    pathname === item.segment &&
                      "bg-muted text-foreground"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-border bg-card md:hidden py-3 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-muted-foreground hover:text-foreground",
                    pathname === item.segment &&
                      "bg-muted text-foreground"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
