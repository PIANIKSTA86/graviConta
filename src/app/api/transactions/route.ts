import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
  }
}

const transactionSchema = z.object({
  voucherType: z.enum(['INGRESO', 'EGRESO', 'TRASLADO', 'DIARIO']),
  description: z.string().min(1),
  date: z.string().transform((str) => new Date(str)),
  details: z.array(z.object({
    accountId: z.string(),
    description: z.string().optional(),
    debit: z.number().min(0),
    credit: z.number().min(0),
    thirdPartyId: z.string().optional(),
  })).min(2),
  thirdPartyId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const voucherType = searchParams.get('voucherType')
    const status = searchParams.get('status')

    const where: any = {
      companyId: decoded.companyId,
    }

    if (voucherType) {
      where.voucherType = voucherType
    }

    if (status) {
      where.status = status
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          details: {
            include: {
              account: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                }
              }
            }
          },
          thirdParty: {
            select: {
              id: true,
              name: true,
              identificationNumber: true,
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error obteniendo transacciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = transactionSchema.parse(body)

    // Validar que los débitos y créditos sean iguales
    const totalDebit = validatedData.details.reduce((sum, detail) => sum + detail.debit, 0)
    const totalCredit = validatedData.details.reduce((sum, detail) => sum + detail.credit, 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: 'Los débitos y créditos deben ser iguales' },
        { status: 400 }
      )
    }

    // Validar que cada detalle tenga o débito o crédito, no ambos
    for (const detail of validatedData.details) {
      if (detail.debit > 0 && detail.credit > 0) {
        return NextResponse.json(
          { error: 'Cada detalle debe tener débito o crédito, no ambos' },
          { status: 400 }
        )
      }
    }

    // Obtener el periodo contable desde la base de datos
    const transactionDate = new Date(validatedData.date)
    const period = await db.accountingPeriod.findFirst({
      where: {
        companyId: decoded.companyId,
        year: transactionDate.getFullYear(),
        month: transactionDate.getMonth() + 1,
        status: 'OPEN'
      }
    })

    if (!period) {
      return NextResponse.json(
        { error: 'No hay un periodo contable abierto para esta fecha' },
        { status: 400 }
      )
    }

    // Obtener tipo de comprobante para prefijo y consecutivo
    const vt = await db.voucherType.findFirst({
      where: { companyId: decoded.companyId, code: validatedData.voucherType }
    })

    if (!vt || !vt.isActive) {
      return NextResponse.json(
        { error: 'Tipo de comprobante no configurado o inactivo' },
        { status: 400 }
      )
    }

    // Incrementar consecutivo de forma segura
    const updatedVT = await db.voucherType.update({
      where: { id: vt.id },
      data: { currentConsecutive: vt.currentConsecutive + 1 }
    })
    const baseNumber = (updatedVT.currentConsecutive).toString().padStart(6, '0')
    const voucherNumber = `${vt.prefix ?? ''}${baseNumber}`

    // Crear transacción en la base de datos
    const transaction = await db.transaction.create({
      data: {
        companyId: decoded.companyId,
        voucherType: validatedData.voucherType,
        voucherNumber,
        description: validatedData.description,
        date: transactionDate,
        totalDebit,
        totalCredit,
        status: 'POSTED',
        createdBy: decoded.userId,
        periodId: period.id,
        thirdPartyId: validatedData.thirdPartyId,
        details: {
          create: validatedData.details.map(detail => ({
            accountId: detail.accountId,
            description: detail.description,
            debit: detail.debit,
            credit: detail.credit,
            thirdPartyId: detail.thirdPartyId,
          }))
        }
      },
      include: {
        details: {
          include: {
            account: {
              select: {
                id: true,
                code: true,
                name: true,
              }
            }
          }
        },
        thirdParty: {
          select: {
            id: true,
            name: true,
            identificationNumber: true,
          }
        }
      }
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entityType: 'TRANSACTION',
        entityId: transaction.id,
        newValues: JSON.stringify(transaction),
        ipAddress: 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Comprobante creado exitosamente en la base de datos',
      transaction
    })

  } catch (error) {
    console.error('Error creando transacción:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}