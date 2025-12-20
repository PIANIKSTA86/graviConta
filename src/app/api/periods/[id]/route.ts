import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const period = await db.accountingPeriod.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    })

    if (!period) {
      return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ period })
  } catch (error) {
    console.error('Error obteniendo período:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, closingDate } = body

    const existingPeriod = await db.accountingPeriod.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    })

    if (!existingPeriod) {
      return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })
    }

    // Validar estado
    if (existingPeriod.status === 'LOCKED') {
      return NextResponse.json({ error: 'No se puede modificar un período bloqueado' }, { status: 400 })
    }

    const period = await db.accountingPeriod.update({
      where: { id },
      data: {
        status: status || existingPeriod.status,
        closingDate: closingDate ? new Date(closingDate) : existingPeriod.closingDate,
      },
    })

    // Auditoría
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entityType: 'PERIOD',
        entityId: period.id,
        oldValues: JSON.stringify(existingPeriod),
        newValues: JSON.stringify(period),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      message: 'Período actualizado exitosamente',
      period,
    })
  } catch (error) {
    console.error('Error actualizando período:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const existingPeriod = await db.accountingPeriod.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        transactions: true,
      },
    })

    if (!existingPeriod) {
      return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })
    }

    // Validar que no tenga transacciones
    if (existingPeriod.transactions && existingPeriod.transactions.length > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar un período con transacciones asociadas',
        hasTransactions: true,
      }, { status: 400 })
    }

    await db.accountingPeriod.delete({
      where: { id },
    })

    // Auditoría
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE',
        entityType: 'PERIOD',
        entityId: existingPeriod.id,
        oldValues: JSON.stringify(existingPeriod),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      message: 'Período eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error eliminando período:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
