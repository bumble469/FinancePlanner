'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/animate/reveal'
import { Stagger, StaggerItem } from '@/components/animate/stagger'

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#about', label: 'About' },
    { href: '#cta', label: 'Get Started' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Reveal>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">$</span>
            </div>
            <span>FinanceFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/40"
            >
              <Link href="/login">Login</Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="cursor-pointer hover:bg-primary/90"
            >
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Reveal>

      {/* Mobile Navigation */}
      {isOpen && (
        <Reveal>
          <div className="md:hidden border-t border-border bg-background px-6 py-4">
            <Stagger>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <StaggerItem key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </a>
                  </StaggerItem>
                ))}

                <StaggerItem>
                  <div className="flex flex-col gap-2 pt-4 border-t border-border">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                    >
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        Login
                      </Link>
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      className="w-full cursor-pointer hover:bg-primary/90"
                    >
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                </StaggerItem>
              </nav>
            </Stagger>
          </div>
        </Reveal>
      )}
    </header>
  )
}
