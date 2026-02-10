'use client'

import React from "react"
import { useState } from 'react'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { AccountTypeToggle } from '@/components/auth/account-type-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FcGoogle } from "react-icons/fc"

import { Reveal } from '@/components/animate/reveal'
import { Stagger, StaggerItem } from '@/components/animate/stagger'

interface SignupFormValues {
  accountType: 'individual' | 'company'
  companyName: string
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  accountType?: string
  companyName?: string
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormValues>({
    accountType: 'individual',
    companyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (formData.accountType === 'company' && !formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) return
    console.log('Signup attempt:', formData)
  }

  const handleAccountTypeChange = (value: 'individual' | 'company') => {
    setFormData({ ...formData, accountType: value, companyName: '' })
    if (errors.accountType || errors.companyName) {
      setErrors({ ...errors, accountType: undefined, companyName: undefined })
    }
  }

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google'
  }

  return (
    <Reveal>
      <AuthCard title="Create Account" subtitle="Join FinanceFlow to manage your finances">

        <Stagger>
          <form onSubmit={handleSubmit} className="space-y-4">

            <StaggerItem>
              <AccountTypeToggle
                value={formData.accountType}
                onChange={handleAccountTypeChange}
              />
            </StaggerItem>

            {formData.accountType === 'company' && (
              <StaggerItem>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Your Company Inc."
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value })
                      if (errors.companyName) {
                        setErrors({ ...errors, companyName: undefined })
                      }
                    }}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">
                      {errors.companyName}
                    </p>
                  )}
                </div>
              </StaggerItem>
            )}

            <StaggerItem>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) {
                      setErrors({ ...errors, name: undefined })
                    }
                  }}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            </StaggerItem>

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
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined })
                    }
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
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined })
                    }
                  }}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: undefined })
                    }
                  }}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </StaggerItem>

            <StaggerItem>
              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </StaggerItem>

          </form>

          <StaggerItem>
            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <Button
              type="button"
              variant="ghost"
              onClick={handleGoogleSignup}
              className="
                w-full flex items-center justify-center gap-2
                border-border
                bg-background
                hover:text-foreground
                hover:border-border cursor-pointer
              "
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </Button>
          </StaggerItem>

        </Stagger>

      </AuthCard>
    </Reveal>
  )
}
