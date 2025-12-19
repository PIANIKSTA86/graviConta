import { useState, useCallback } from 'react'

export interface ValidationViolation {
  valid: boolean
  violations: string[]
  rules: {
    requiresCostCenter?: boolean
    appliesWithholding?: boolean
    appliesTaxes?: boolean
    isTemplate?: boolean
  }
}

export function useAccountValidation(token: string | null) {
  const [isValidating, setIsValidating] = useState(false)

  const validateAccount = useCallback(
    async (
      accountId: string,
      costCenterId?: string,
      hasWithholding?: boolean,
      hasTax?: boolean
    ): Promise<ValidationViolation | null> => {
      if (!token) return null

      try {
        setIsValidating(true)
        const res = await fetch('/api/accounts/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accountId,
            costCenterId: costCenterId || null,
            hasWithholding: hasWithholding ?? false,
            hasTax: hasTax ?? false,
          }),
        })

        if (!res.ok) {
          console.error('Validation error:', await res.text())
          return null
        }

        return await res.json()
      } catch (error) {
        console.error('Error validating account:', error)
        return null
      } finally {
        setIsValidating(false)
      }
    },
    [token]
  )

  return { validateAccount, isValidating }
}
