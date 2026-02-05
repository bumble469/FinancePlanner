'use client'

import React from "react"
import Link from 'next/link'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import { Reveal } from '@/components/animate/reveal'
import { Stagger } from '@/components/animate/stagger'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            {/* Title row */}
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">
                {title}
              </CardTitle>

              {/* Back link on extreme right */}
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Back
              </Link>
            </div>

            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </CardHeader>

          <hr className="border-border" />

          <CardContent>
            <Stagger>
              {children}
            </Stagger>
          </CardContent>
        </Card>
    </div>
  )
}
