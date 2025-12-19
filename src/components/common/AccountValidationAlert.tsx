"use client"

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

interface ValidationViolation {
  valid: boolean
  violations: string[]
  rules: {
    requiresCostCenter?: boolean
    appliesWithholding?: boolean
    appliesTaxes?: boolean
    isTemplate?: boolean
  }
}

interface Props {
  validation: ValidationViolation | null
  loading?: boolean
}

export function AccountValidationAlert({ validation, loading }: Props) {
  if (!validation) return null

  if (validation.valid) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">Validación correcta</AlertTitle>
        <AlertDescription className="text-green-800">
          La cuenta cumple con todas las reglas configuradas.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-900">Validación fallida</AlertTitle>
      <AlertDescription className="text-red-800">
        <ul className="mt-2 list-inside list-disc space-y-1">
          {validation.violations.map((violation, i) => (
            <li key={i}>{violation}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

interface RulesDisplayProps {
  rules: {
    requiresCostCenter?: boolean
    appliesWithholding?: boolean
    appliesTaxes?: boolean
    isTemplate?: boolean
  }
}

export function AccountRulesDisplay({ rules }: RulesDisplayProps) {
  const activeRules = Object.entries(rules)
    .filter(([_, value]) => value)
    .map(([key]) => {
      const labels: Record<string, string> = {
        requiresCostCenter: 'Requiere centros de costo',
        appliesWithholding: 'Aplica retenciones',
        appliesTaxes: 'Aplica impuestos',
        isTemplate: 'Es plantilla (no permite movimientos)',
      }
      return labels[key] || key
    })

  if (activeRules.length === 0) return null

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <AlertTriangle className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900">Reglas activas</AlertTitle>
      <AlertDescription className="text-blue-800">
        <ul className="mt-2 list-inside list-disc space-y-1">
          {activeRules.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
