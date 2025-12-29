import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  code: z.string().min(2).max(10).optional(),
  name: z.string().min(2).optional(),
  prefix: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const item = await db.voucherType.findFirst({
      where: { id: params.id, companyId: user.companyId }
    })
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error obteniendo tipo de comprobante:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const data = updateSchema.parse(body)

    const current = await db.voucherType.findFirst({ where: { id: params.id, companyId: user.companyId } })
    if (!current) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    if (data.code && data.code !== current.code) {
      const duplicate = await db.voucherType.findFirst({ where: { companyId: user.companyId, code: data.code } })
      if (duplicate) return NextResponse.json({ error: 'Código ya existe' }, { status: 400 })
    }

    const updated = await db.voucherType.update({
      where: { id: params.id },
      data: data,
    })

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entityType: 'VOUCHER_TYPE',
        entityId: updated.id,
        oldValues: JSON.stringify(current),
        newValues: JSON.stringify(updated),
        ipAddress: 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({ message: 'Actualizado', voucherType: updated })
  } catch (error) {
    console.error('Error actualizando tipo de comprobante:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const item = await db.voucherType.findFirst({ where: { id: params.id, companyId: user.companyId } })
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    // Validar si tiene movimientos asociados: buscamos transacciones con voucherType == item.code
    const hasTransactions = await db.transaction.count({
      where: { companyId: user.companyId, voucherType: item.code }
    })
    if (hasTransactions > 0) {
      return NextResponse.json({ error: 'No se puede eliminar: hay comprobantes asociados. Desactívalo en su lugar.' }, { status: 400 })
    }

    await db.voucherType.delete({ where: { id: params.id } })

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE',
        entityType: 'VOUCHER_TYPE',
        entityId: item.id,
        oldValues: JSON.stringify(item),
        ipAddress: 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({ message: 'Eliminado' })
  } catch (error) {
    console.error('Error eliminando tipo de comprobante:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
