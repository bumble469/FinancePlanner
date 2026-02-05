'use client'

import { CheckCircle, BarChart3, Settings } from 'lucide-react'

import { Reveal } from '@/components/animate/reveal'
import { Stagger, StaggerItem } from '@/components/animate/stagger'

export function HowItWorksSection() {
  const steps = [
    {
      icon: CheckCircle,
      number: '01',
      title: 'Create Your Plans',
      description:
        'Set up multiple financial plans for projects, events, or business operations. Each plan has its own dashboard and metrics.',
    },
    {
      icon: Settings,
      number: '02',
      title: 'Add Team & Expenses',
      description:
        'Organize team members by roles, assign costs, and categorize expenses. Track everything in real-time.',
    },
    {
      icon: BarChart3,
      number: '03',
      title: 'Monitor & Analyze',
      description:
        'View beautiful dashboards with real-time metrics, status indicators, and financial insights at a glance.',
    },
  ]

  return (
    <section id="about" className="w-full py-20 md:py-32 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="space-y-12">

          {/* Section Header */}
          <Reveal>
            <div className="space-y-4 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground text-balance">
                How FinanceFlow Works
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Simple, intuitive, and powerful. Get started in minutes.
              </p>
            </div>
          </Reveal>

          {/* Steps */}
          <Reveal delay={0.15}>
            <Stagger>
              <div className="grid md:grid-cols-3 gap-10">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <StaggerItem key={index}>
                      <div className="relative space-y-5">

                        {/* Thick Accent Bar */}
                        <div className="h-2 w-16 rounded-full bg-primary/40" />

                        {/* Number + Icon */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                            <span className="text-primary font-bold">
                              {step.number}
                            </span>
                          </div>

                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {step.title}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                      </div>
                    </StaggerItem>
                  )
                })}
              </div>
            </Stagger>
          </Reveal>

        </div>
      </div>
    </section>
  )
}
