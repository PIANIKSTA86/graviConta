import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const voucherTypeSchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(2),
  prefix: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const status = searchParams.get('status') // ACTIVE / INACTIVE / ALL

    const where: any = { companyId: user.companyId }
    if (status === 'ACTIVE') where.isActive = true
    else if (status === 'INACTIVE') where.isActive = false

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { prefix: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.voucherType.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.voucherType.count({ where })
    ])

    return NextResponse.json({
      voucherTypes: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error obteniendo tipos de comprobantes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const data = voucherTypeSchema.parse(body)

    // Evitar duplicados por código dentro de la compañía
    const exists = await db.voucherType.findFirst({
      where: { companyId: user.companyId, code: data.code }
    })
    if (exists) return NextResponse.json({ error: 'Código ya existe' }, { status: 400 })

    const created = await db.voucherType.create({
      data: {
        companyId: user.companyId,
        code: data.code,
        name: data.name,
        prefix: data.prefix,
        isActive: data.isActive ?? true,
      }
    })

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE',
        entityType: 'VOUCHER_TYPE',
        entityId: created.id,
        newValues: JSON.stringify(created),
        ipAddress: 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({ message: 'Tipo de comprobante creado', voucherType: created })
  } catch (error) {
    console.error('Error creando tipo de comprobante:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
