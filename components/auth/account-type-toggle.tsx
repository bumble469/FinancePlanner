'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface AccountTypeToggleProps {
  value: 'individual' | 'company'
  onChange: (value: 'individual' | 'company') => void
}

/**
 * AccountTypeToggle - Radio group for account type selection
 * Uses existing UI primitives (RadioGroup, Label)
 * Controlled component with no global state
 */
export function AccountTypeToggle({ value, onChange }: AccountTypeToggleProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Account Type</p>
      <RadioGroup value={value} onValueChange={(val) => onChange(val as 'individual' | 'company')}>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="individual" id="individual" />
          <Label htmlFor="individual" className="cursor-pointer font-normal">
            Individual
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="company" id="company" />
          <Label htmlFor="company" className="cursor-pointer font-normal">
            Company
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
