"use client";

import { Box, Sparkles } from "lucide-react";

interface SplinePlaceholderProps {
  title?: string;
  description?: string;
}

/**
 * Placeholder component for Spline 3D visualization
 *
 * INTEGRATION POINT:
 * Replace this component with actual Spline embed:
 *
 * ```tsx
 * import Spline from '@splinetool/react-spline';
 *
 * <Spline scene="YOUR_SPLINE_SCENE_URL" />
 * ```
 *
 * The Spline scene should visualize:
 * - Money flows between expense categories
 * - Team members as 3D avatars
 * - Budget allocation as physical objects
 * - Real-time updates based on financial data
 */
export function SplinePlaceholder({
  title = "3D Financial Scene",
  description = "Interactive visualization of your financial data",
}: SplinePlaceholderProps) {
  return (
    <div className="relative flex h-full min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating elements animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-20 w-20 animate-pulse rounded-full bg-primary/10" />
        <div className="absolute right-1/4 top-1/3 h-16 w-16 animate-pulse rounded-full bg-success/10 [animation-delay:0.5s]" />
        <div className="absolute bottom-1/4 left-1/3 h-24 w-24 animate-pulse rounded-full bg-warning/10 [animation-delay:1s]" />
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
          <Box className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h3 className="flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            {title}
          </h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-2">
          <code className="text-xs text-muted-foreground">
            Spline Embed Here
          </code>
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2">
        <span className="text-xs text-muted-foreground">
          Data binding ready
        </span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Live sync</span>
        </div>
      </div>
    </div>
  );
}
