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

const thirdPartySchema = z.object({
  identificationType: z.enum(['CC', 'NIT', 'CE', 'TI']),
  identificationNumber: z.string().min(5),
  name: z.string().min(2),
  commercialName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'BOTH']),
  taxRegime: z.enum(['COMUN', 'SIMPLIFICADO', 'GRAN_CONTRIBUYENTE']),
  isAutoRetainer: z.boolean().default(false),
  fiscalResponsibilities: z.string().optional(),
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
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: any = {
      companyId: decoded.companyId,
      isActive: true,
    }

    if (type && type !== 'ALL') {
      where.type = type
    } else if (type === 'ALL') {
      // No filter for ALL
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { commercialName: { contains: search, mode: 'insensitive' } },
        { identificationNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [thirdParties, total] = await Promise.all([
      db.thirdParty.findMany({
        where,
        include: {
          accounts: {
            include: {
              account: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.thirdParty.count({ where })
    ])

    return NextResponse.json({
      thirdParties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error obteniendo terceros:', error)
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
    const validatedData = thirdPartySchema.parse(body)

    // Verificar si ya existe un tercero con la misma identificación en la base de datos
    const existingThirdParty = await db.thirdParty.findFirst({
      where: {
        companyId: decoded.companyId,
        identificationNumber: validatedData.identificationNumber
      }
    })

    if (existingThirdParty) {
      return NextResponse.json(
        { error: 'Ya existe un tercero con esta identificación' },
        { status: 400 }
      )
    }

    // Crear tercero en la base de datos
    const thirdParty = await db.thirdParty.create({
      data: {
        companyId: decoded.companyId,
        ...validatedData,
      }
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entityType: 'THIRD_PARTY',
        entityId: thirdParty.id,
        newValues: JSON.stringify(thirdParty),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Tercero creado exitosamente en la base de datos',
      thirdParty
    })

  } catch (error) {
    console.error('Error creando tercero:', error)
    
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