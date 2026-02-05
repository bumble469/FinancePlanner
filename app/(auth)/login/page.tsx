'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Reveal } from '@/components/animate/reveal'
import { Stagger, StaggerItem } from '@/components/animate/stagger'

interface LoginFormValues {
  email: string
  password: string
}

interface LoginApiResponse {
  success: boolean
  data?: {
    accessToken: string
    user: {
      id: string
      email: string
      name: string | null
    }
  }
  error?: string
  errors?: Record<string, string>
}

export default function LoginPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<LoginFormValues>({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<Partial<LoginFormValues & { general: string }>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) return

    try {
      setLoading(true)

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result: LoginApiResponse = await res.json()

      if (!res.ok || !result.success) {
        setErrors({
          general: result.errors?.general || result.error || 'Login failed',
        })
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    console.log('Continue with Google clicked')
  }

  return (
    <Reveal>
      <AuthCard title="Login" subtitle="Sign in to your account">
        <Stagger>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <StaggerItem>
                <p className="text-sm text-destructive text-center">
                  {errors.general}
                </p>
              </StaggerItem>
            )}

            <StaggerItem>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors({ ...errors, email: undefined })
                  }}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password)
                      setErrors({ ...errors, password: undefined })
                  }}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            </StaggerItem>

            <StaggerItem>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </StaggerItem>
          </form>

          <StaggerItem>
            <div className="my-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </StaggerItem>

          <StaggerItem>
            <Button
              variant="outline"
              className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary/40 cursor-pointer"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </Button>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </StaggerItem>
        </Stagger>

      </AuthCard>
    </Reveal>
  )
}
