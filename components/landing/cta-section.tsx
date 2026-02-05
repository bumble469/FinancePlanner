'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/animate/reveal'
import { Stagger, StaggerItem } from '@/components/animate/stagger'

export function CTASection() {
  return (
    <section id="cta" className="relative w-full py-20 md:py-32 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl opacity-10" />
          <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl opacity-20" />
        </div>

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-8 md:p-16 space-y-8 text-center">

          {/* Heading + Description */}
          <Reveal>
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                Ready to Take Control of Your Finances?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Join teams and startups worldwide using FinanceFlow to manage
                their finances smarter. Start your free account today—no credit
                card required.
              </p>
            </div>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={0.15}>
            <Stagger>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <StaggerItem>
                  <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
                    <Link href="/signup">
                      Get Started Now
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </StaggerItem>

                <StaggerItem>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="
                      w-full sm:w-auto
                      cursor-pointer
                      bg-transparent
                      hover:bg-primary/10
                      hover:text-primary
                      hover:border-primary/40
                    "
                  >
                    <Link href="/login">
                      Already a Member? Sign In
                    </Link>
                  </Button>
                </StaggerItem>
              </div>
            </Stagger>
          </Reveal>

          {/* Footer Text */}
          <Reveal delay={0.25}>
            <p className="text-sm text-muted-foreground">
              Enterprise solutions available.{' '}
              <Link href="/contact" className="text-primary hover:underline">
                Contact sales
              </Link>
            </p>
          </Reveal>

        </div>
      </div>
    </section>
  )
}
