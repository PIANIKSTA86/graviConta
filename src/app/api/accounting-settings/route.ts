import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const settingsSchema = z.object({
  accountingType: z.enum(['CAUSACION', 'CAJA']),
  allowCash: z.boolean().optional(),
  baseCurrency: z.string().min(3).max(5),
  multiCurrencyEnabled: z.boolean(),
  secondaryCurrency: z.string().min(3).max(5).nullable().optional(),
  decimals: z.enum(['0', '2', '4']).transform((v) => Number(v)),
  roundingMode: z.enum(['AUTO', 'MANUAL']),
  enableRoundingAdjustments: z.boolean(),
})

const DEFAULT_SETTINGS = {
  accountingType: 'CAUSACION',
  allowCash: true,
  baseCurrency: 'COP',
  multiCurrencyEnabled: false,
  secondaryCurrency: null as string | null,
  decimals: 2,
  roundingMode: 'AUTO',
  enableRoundingAdjustments: true,
}

export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentUser(request)
    if (!current) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    let settings = await db.accountingSettings.findUnique({ where: { companyId: current.companyId } })
    if (!settings) {
      settings = await db.accountingSettings.create({ data: { ...DEFAULT_SETTINGS, companyId: current.companyId } })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/accounting-settings error', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const current = await getCurrentUser(request)
    if (!current) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const parsed = settingsSchema.parse(body)

    if (parsed.multiCurrencyEnabled) {
      if (!parsed.secondaryCurrency || parsed.secondaryCurrency === parsed.baseCurrency) {
        return NextResponse.json({ error: 'Debes definir una moneda secundaria distinta a la base' }, { status: 400 })
      }
    } else {
      parsed.secondaryCurrency = null
    }

    const existing = await db.accountingSettings.findUnique({ where: { companyId: current.companyId } })
    const updated = await db.accountingSettings.upsert({
      where: { companyId: current.companyId },
      update: parsed,
      create: { ...DEFAULT_SETTINGS, ...parsed, companyId: current.companyId },
    })

    await db.auditLog.create({
      data: {
        userId: current.userId,
        action: 'UPDATE',
        entityType: 'ACCOUNTING_SETTINGS',
        entityId: updated.id,
        oldValues: existing ? JSON.stringify(existing) : null,
        newValues: JSON.stringify(updated),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({ message: 'Parámetros contables guardados', settings: updated })
  } catch (error) {
    console.error('PUT /api/accounting-settings error', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
