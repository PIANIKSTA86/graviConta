import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

interface ValidationRule {
  requiresCostCenter?: boolean
  appliesWithholding?: boolean
  appliesTaxes?: boolean
  isTemplate?: boolean
}

interface ValidationResult {
  valid: boolean
  violations: string[]
  rules: ValidationRule
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { accountId, costCenterId, hasWithholding, hasTax } = body

    if (!accountId) {
      return NextResponse.json({ error: 'accountId es requerido' }, { status: 400 })
    }

    // Obtener configuración de la cuenta
    const account = await db.chartOfAccounts.findFirst({
      where: { id: accountId, companyId: user.companyId }
    })

    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    const violations: string[] = []
    const rules: ValidationRule = {
      requiresCostCenter: account.requiresCostCenter,
      appliesWithholding: account.appliesWithholding,
      appliesTaxes: account.appliesTaxes,
      isTemplate: account.isTemplate,
    }

    // Validar reglas
    if (account.isTemplate) {
      violations.push('No se pueden crear movimientos en una cuenta plantilla.')
    }

    if (account.requiresCostCenter && !costCenterId) {
      violations.push('Esta cuenta requiere un centro de costo.')
    }

    if (account.appliesWithholding && !hasWithholding) {
      violations.push('Esta cuenta requiere configuración de retenciones.')
    }

    if (account.appliesTaxes && !hasTax) {
      violations.push('Esta cuenta requiere configuración de impuestos.')
    }

    return NextResponse.json({
      valid: violations.length === 0,
      violations,
      rules,
    })
  } catch (error) {
    console.error('Error en validación de reglas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
