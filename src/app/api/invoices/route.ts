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

const invoiceSchema = z.object({
  thirdPartyId: z.string(),
  date: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(0),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0),
    accountId: z.string(),
  })).min(1),
  notes: z.string().optional(),
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
    const status = searchParams.get('status')
    const thirdPartyId = searchParams.get('thirdPartyId')

    const where: any = {
      companyId: decoded.companyId,
    }

    if (status) {
      where.status = status
    }

    if (thirdPartyId) {
      where.thirdPartyId = thirdPartyId
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          thirdParty: {
            select: {
              id: true,
              name: true,
              identificationNumber: true,
            }
          },
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              taxRate: true,
              taxAmount: true,
              total: true,
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              date: true,
              paymentMethod: true,
              status: true,
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where })
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error obteniendo facturas:', error)
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
    const validatedData = invoiceSchema.parse(body)

    // Calcular totales
    let subtotal = 0
    let totalTaxAmount = 0

    const itemsWithTotals = validatedData.items.map(item => {
      const itemSubtotal = item.quantity * item.unitPrice
      const itemTaxAmount = itemSubtotal * (item.taxRate / 100)
      const itemTotal = itemSubtotal + itemTaxAmount

      subtotal += itemSubtotal
      totalTaxAmount += itemTaxAmount

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: itemSubtotal,
        taxRate: item.taxRate,
        taxAmount: itemTaxAmount,
        total: itemTotal,
        accountId: item.accountId,
      }
    })

    const total = subtotal + totalTaxAmount

    // Generar número de factura
    const lastInvoice = await db.invoice.findFirst({
      where: {
        companyId: decoded.companyId,
      },
      orderBy: { invoiceNumber: 'desc' }
    })

    const invoiceNumber = lastInvoice 
      ? (parseInt(lastInvoice.invoiceNumber) + 1).toString().padStart(6, '0')
      : '000001'

    // Crear factura en la base de datos
    const invoice = await db.invoice.create({
      data: {
        companyId: decoded.companyId,
        invoiceNumber,
        date: validatedData.date,
        dueDate: validatedData.dueDate,
        thirdPartyId: validatedData.thirdPartyId,
        subtotal,
        taxAmount: totalTaxAmount,
        total,
        status: 'DRAFT',
        notes: validatedData.notes,
        items: {
          create: itemsWithTotals
        }
      },
      include: {
        thirdParty: {
          select: {
            id: true,
            name: true,
            identificationNumber: true,
          }
        },
        items: true
      }
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entityType: 'INVOICE',
        entityId: invoice.id,
        newValues: JSON.stringify(invoice),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Factura creada exitosamente en la base de datos',
      invoice
    })

  } catch (error) {
    console.error('Error creando factura:', error)
    
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