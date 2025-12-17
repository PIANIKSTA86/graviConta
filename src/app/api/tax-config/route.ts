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

const taxConfigSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['IVA', 'RETEFUENTE', 'RETEICA', 'ICA']),
  rate: z.number().min(0).max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  appliesTo: z.enum(['ALL', 'SERVICES', 'GOODS', 'SPECIFIC']),
  accountDebitId: z.string().optional(),
  accountCreditId: z.string().optional(),
  threshold: z.number().optional(), // Umbral para retenciones
  baseType: z.enum(['TOTAL', 'SUBTOTAL', 'TAX_BASE']).default('TOTAL'),
})

// Configuración inicial de impuestos para Colombia
const DEFAULT_TAX_CONFIG = [
  {
    name: 'IVA 19%',
    type: 'IVA',
    rate: 19,
    description: 'Impuesto al Valor Agregado estándar',
    isActive: true,
    appliesTo: 'ALL' as const,
    baseType: 'TOTAL' as const,
  },
  {
    name: 'IVA 5%',
    type: 'IVA',
    rate: 5,
    description: 'IVA reducido para bienes y servicios específicos',
    isActive: true,
    appliesTo: 'SPECIFIC' as const,
    baseType: 'TOTAL' as const,
  },
  {
    name: 'IVA 0%',
    type: 'IVA',
    rate: 0,
    description: 'Exentos de IVA',
    isActive: true,
    appliesTo: 'SPECIFIC' as const,
    baseType: 'TOTAL' as const,
  },
  {
    name: 'Retefuente 2.5%',
    type: 'RETEFUENTE',
    rate: 2.5,
    description: 'Retención en la fuente para servicios',
    isActive: true,
    appliesTo: 'SERVICES' as const,
    threshold: 3341566, // UVT 100 x 33.415,66 (2024)
    baseType: 'TOTAL' as const,
  },
  {
    name: 'Retefuente 1%',
    type: 'RETEFUENTE',
    rate: 1,
    description: 'Retención en la fuente para compra de bienes',
    isActive: true,
    appliesTo: 'GOODS' as const,
    threshold: 3341566, // UVT 100 x 33.415,66 (2024)
    baseType: 'TOTAL' as const,
  },
  {
    name: 'ICA 0.484%',
    type: 'ICA',
    rate: 0.484,
    description: 'Industria y Comercio y Avisos - Bogotá',
    isActive: true,
    appliesTo: 'ALL' as const,
    threshold: 39058, // SMMLV 2024 x 0.484%
    baseType: 'TOTAL' as const,
  }
]

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
    const initialize = searchParams.get('initialize')

    if (initialize === 'true') {
      // Verificar si ya existe configuración de impuestos
      const existingTaxConfigsCount = await db.taxConfig.count({
        where: { companyId: decoded.companyId }
      })
      
      if (existingTaxConfigsCount === 0) {
        // Obtener cuentas contables para asociar
        const accounts = await db.chartOfAccounts.findMany({
          where: {
            companyId: decoded.companyId,
            code: {
              in: ['240805', '135515', '236565', '236510'] // Cuentas típicas para impuestos
            }
          }
        })

        const accountMap = new Map()
        accounts.forEach(account => {
          accountMap.set(account.code, account.id)
        })

        // Crear configuración de impuestos por defecto
        const taxConfigsWithAccounts = DEFAULT_TAX_CONFIG.map(config => {
          let accountDebitId = null
          let accountCreditId = null

          // Asignar cuentas contables según el tipo de impuesto
          if (config.type === 'IVA') {
            accountCreditId = accountMap.get('240805') || null // IVA generado
          } else if (config.type === 'RETEFUENTE') {
            accountDebitId = accountMap.get('135515') || null // Retefuente descontada
            accountCreditId = accountMap.get('236565') || null // Retefuente por pagar
          } else if (config.type === 'ICA') {
            accountDebitId = accountMap.get('236510') || null // ICA pagado
          }

          return {
            ...config,
            companyId: decoded.companyId,
            accountDebitId,
            accountCreditId,
          }
        })

        await db.taxConfig.createMany({
          data: taxConfigsWithAccounts
        })
      }
    }

    // Obtener configuración de impuestos de la base de datos
    const taxConfigs = await db.taxConfig.findMany({
      where: {
        companyId: decoded.companyId
      },
      include: {
        debitAccount: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        creditAccount: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      taxConfigs,
      isDefault: taxConfigs.length === 0
    })

  } catch (error) {
    console.error('Error obteniendo configuración de impuestos:', error)
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
    const validatedData = taxConfigSchema.parse(body)

    // Verificar si ya existe una configuración con el mismo nombre y tipo
    const existingTaxConfig = await db.taxConfig.findFirst({
      where: {
        companyId: decoded.companyId,
        name: validatedData.name,
        type: validatedData.type
      }
    })

    if (existingTaxConfig) {
      return NextResponse.json(
        { error: 'Ya existe una configuración de impuesto con este nombre y tipo' },
        { status: 400 }
      )
    }

    // Crear configuración de impuesto en la base de datos
    const taxConfig = await db.taxConfig.create({
      data: {
        companyId: decoded.companyId,
        ...validatedData,
      },
      include: {
        debitAccount: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        creditAccount: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        }
      }
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entityType: 'TAX_CONFIG',
        entityId: taxConfig.id,
        newValues: JSON.stringify(taxConfig),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Configuración de impuesto creada exitosamente',
      taxConfig
    })

  } catch (error) {
    console.error('Error creando configuración de impuesto:', error)
    
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

export async function PUT(request: NextRequest) {
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
    const taxConfigId = searchParams.get('id')

    if (!taxConfigId) {
      return NextResponse.json(
        { error: 'ID de configuración de impuesto requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = taxConfigSchema.parse(body)

    // Verificar si la configuración existe y pertenece a la empresa
    const existingTaxConfig = await db.taxConfig.findFirst({
      where: {
        id: taxConfigId,
        companyId: decoded.companyId
      }
    })

    if (!existingTaxConfig) {
      return NextResponse.json(
        { error: 'Configuración de impuesto no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar configuración de impuesto
    const updatedTaxConfig = await db.taxConfig.update({
      where: { id: taxConfigId },
      data: validatedData,
      include: {
        debitAccount: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        creditAccount: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        }
      }
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE',
        entityType: 'TAX_CONFIG',
        entityId: taxConfigId,
        oldValues: JSON.stringify(existingTaxConfig),
        newValues: JSON.stringify(updatedTaxConfig),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Configuración de impuesto actualizada exitosamente',
      taxConfig: updatedTaxConfig
    })

  } catch (error) {
    console.error('Error actualizando configuración de impuesto:', error)
    
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

export async function DELETE(request: NextRequest) {
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
    const taxConfigId = searchParams.get('id')

    if (!taxConfigId) {
      return NextResponse.json(
        { error: 'ID de configuración de impuesto requerido' },
        { status: 400 }
      )
    }

    // Verificar si la configuración existe y pertenece a la empresa
    const existingTaxConfig = await db.taxConfig.findFirst({
      where: {
        id: taxConfigId,
        companyId: decoded.companyId
      }
    })

    if (!existingTaxConfig) {
      return NextResponse.json(
        { error: 'Configuración de impuesto no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar configuración de impuesto
    await db.taxConfig.delete({
      where: { id: taxConfigId }
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'DELETE',
        entityType: 'TAX_CONFIG',
        entityId: taxConfigId,
        oldValues: JSON.stringify(existingTaxConfig),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Configuración de impuesto eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error eliminando configuración de impuesto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}