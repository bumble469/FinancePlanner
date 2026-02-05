'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/animate/reveal'
import { Stagger, StaggerItem } from '@/components/animate/stagger'

export function HeroSection() {
  const scrollToFeatures = () => {
    const element = document.getElementById('features')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen w-full bg-background pt-20 md:pt-18 pb-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl opacity-10" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center space-y-8">

          {/* Badge */}
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">
                Now Available: Smart Financial Planning
              </span>
            </div>
          </Reveal>

          {/* Headline + Description */}
          <Reveal delay={0.1}>
            <div className="space-y-6">
              <h1 className="text-balance text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Take Control of Your{' '}
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  Financial Future
                </span>
              </h1>

              <p className="text-balance mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
                FinanceFlow is a comprehensive financial management platform
                designed for teams, startups, and event planners. Track
                expenses, manage budgets, and visualize your financial health
                with intelligent dashboards.
              </p>
            </div>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto gap-2">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={scrollToFeatures}
                className="
                  w-full sm:w-auto
                  cursor-pointer
                  bg-transparent
                  hover:bg-primary/10
                  hover:text-primary
                  hover:border-primary/40
                "
              >
                Learn More
              </Button>
            </div>
          </Reveal>

          {/* Stats Row */}
          <Reveal delay={0.3}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-12 border-t border-border/50">
              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  100%
                </p>
                <p className="text-sm text-muted-foreground">Data Privacy</p>
              </div>

              <div className="space-y-2">
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  Real-time
                </p>
                <p className="text-sm text-muted-foreground">Analytics</p>
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  Multi-Plan
                </p>
                <p className="text-sm text-muted-foreground">
                  Management
                </p>
              </div>
            </div>
          </Reveal>

          {/* Feature Highlights */}
          <Reveal delay={0.4}>
            <Stagger>
              <div className="grid md:grid-cols-3 gap-6 pt-12 max-w-4xl mx-auto">
                <StaggerItem>
                  <div className="rounded-lg border border-border/50 bg-card/50 p-6 space-y-3 backdrop-blur-sm hover:border-primary/30 transition-colors">
                    <BarChart3 className="h-6 w-6 text-primary mx-auto" />
                    <h3 className="font-semibold text-foreground">
                      Visual Dashboards
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Beautiful charts and metrics for instant financial
                      insights
                    </p>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="rounded-lg border border-border/50 bg-card/50 p-6 space-y-3 backdrop-blur-sm hover:border-primary/30 transition-colors">
                    <BarChart3 className="h-6 w-6 text-primary mx-auto" />
                    <h3 className="font-semibold text-foreground">
                      Team Collaboration
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage roles, permissions, and team members efficiently
                    </p>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="rounded-lg border border-border/50 bg-card/50 p-6 space-y-3 backdrop-blur-sm hover:border-primary/30 transition-colors">
                    <BarChart3 className="h-6 w-6 text-primary mx-auto" />
                    <h3 className="font-semibold text-foreground">
                      Smart Simulation
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Test scenarios and make informed decisions
                    </p>
                  </div>
                </StaggerItem>
              </div>
            </Stagger>
          </Reveal>

        </div>
      </div>
    </section>
  )
}
