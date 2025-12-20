import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const periods = await db.accountingPeriod.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    })

    return NextResponse.json({ periods })
  } catch (error) {
    console.error('Error obteniendo períodos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { year, month, openingDate } = body

    if (!year || !month || !openingDate) {
      return NextResponse.json({ error: 'Año, mes y fecha de apertura son requeridos' }, { status: 400 })
    }

    // Validar que el período no exista
    const existing = await db.accountingPeriod.findUnique({
      where: {
        companyId_year_month: {
          companyId: user.companyId,
          year: parseInt(year),
          month: parseInt(month),
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'El período ya existe' }, { status: 400 })
    }

    // Crear período
    const period = await db.accountingPeriod.create({
      data: {
        companyId: user.companyId,
        year: parseInt(year),
        month: parseInt(month),
        status: 'OPEN',
        openingDate: new Date(openingDate),
      },
    })

    // Auditoría
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE',
        entityType: 'PERIOD',
        entityId: period.id,
        newValues: JSON.stringify(period),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      message: 'Período creado exitosamente',
      period,
    })
  } catch (error) {
    console.error('Error creando período:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
