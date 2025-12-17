import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

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

    // Crear terceros de demostración en la base de datos
    const demoThirdParties = [
      {
        identificationType: 'NIT',
        identificationNumber: '900123456-7',
        name: 'Distribuidora Nacional S.A.',
        commercialName: 'DistriNacional',
        address: 'Calle 100 # 50-50',
        phone: '3011234567',
        email: 'contacto@distrinacional.com',
        city: 'Bogotá',
        department: 'Cundinamarca',
        type: 'CUSTOMER',
        taxRegime: 'COMUN',
        isAutoRetainer: true,
        fiscalResponsibilities: JSON.stringify(['IVA', 'RETEFUENTE', 'ICA']),
      },
      {
        identificationType: 'NIT',
        identificationNumber: '800987654-3',
        name: 'Papelería El Escribiente',
        commercialName: 'Papelería El Escribiente',
        address: 'Carrera 15 # 20-30',
        phone: '3119876543',
        email: 'ventas@papeleriaescribiente.com',
        city: 'Bogotá',
        department: 'Cundinamarca',
        type: 'SUPPLIER',
        taxRegime: 'COMUN',
        isAutoRetainer: false,
        fiscalResponsibilities: JSON.stringify(['IVA']),
      },
      {
        identificationType: 'CC',
        identificationNumber: '12345678',
        name: 'Juan Pérez Rodríguez',
        address: 'Avenida 1 # 2-3',
        phone: '3105551234',
        email: 'juan.perez@email.com',
        city: 'Bogotá',
        department: 'Cundinamarca',
        type: 'CUSTOMER',
        taxRegime: 'SIMPLIFICADO',
        isAutoRetainer: false,
        fiscalResponsibilities: JSON.stringify([]),
      },
      {
        identificationType: 'NIT',
        identificationNumber: '860012345-8',
        name: 'Tecnología y Servicios SAS',
        commercialName: 'TechSAS',
        address: 'Calle 72 # 45-90',
        phone: '3008889999',
        email: 'info@techsas.com',
        city: 'Medellín',
        department: 'Antioquia',
        type: 'BOTH',
        taxRegime: 'COMUN',
        isAutoRetainer: true,
        fiscalResponsibilities: JSON.stringify(['IVA', 'RETEFUENTE', 'ICA', 'RETEICA']),
      }
    ]

    const createdThirdParties = []
    for (const thirdPartyData of demoThirdParties) {
      const existing = await db.thirdParty.findFirst({
        where: {
          companyId: decoded.companyId,
          identificationNumber: thirdPartyData.identificationNumber
        }
      })

      if (!existing) {
        const thirdParty = await db.thirdParty.create({
          data: {
            companyId: decoded.companyId,
            ...thirdPartyData,
          }
        })
        createdThirdParties.push(thirdParty)
      }
    }

    // Obtener cuentas contables para las transacciones
    const accounts = await db.chartOfAccounts.findMany({
      where: {
        companyId: decoded.companyId,
        allowsMovement: true
      }
    })

    const accountMap = new Map()
    accounts.forEach(account => {
      accountMap.set(account.code, account.id)
    })

    // Crear transacciones de demostración en la base de datos
    const demoTransactions = [
      {
        voucherType: 'INGRESO',
        description: 'Venta de mercancías a DistriNacional',
        date: new Date('2024-01-15'),
        details: [
          { accountId: accountMap.get('110505')?.id, debit: 1200000, credit: 0, description: 'Ingreso por ventas' },
          { accountId: accountMap.get('410505')?.id, debit: 0, credit: 1200000, description: 'Ventas de mercancías' },
        ]
      },
      {
        voucherType: 'EGRESO',
        description: 'Compra de papelería y útiles de oficina',
        date: new Date('2024-01-20'),
        details: [
          { accountId: accountMap.get('511015')?.id, debit: 350000, credit: 0, description: 'Gastos de papelería' },
          { accountId: accountMap.get('110505')?.id, debit: 0, credit: 350000, description: 'Egreso por papelería' },
        ]
      },
      {
        voucherType: 'DIARIO',
        description: 'Constitución de capital social inicial',
        date: new Date('2024-01-01'),
        details: [
          { accountId: accountMap.get('110505')?.id, debit: 10000000, credit: 0, description: 'Aporte de capital' },
          { accountId: accountMap.get('311505')?.id, debit: 0, credit: 10000000, description: 'Capital social' },
        ]
      },
      {
        voucherType: 'INGRESO',
        description: 'Venta de servicios a Juan Pérez',
        date: new Date('2024-01-25'),
        details: [
          { accountId: accountMap.get('110505')?.id, debit: 800000, credit: 0, description: 'Ingreso por servicios' },
          { accountId: accountMap.get('410510')?.id, debit: 0, credit: 800000, description: 'Servicios prestados' },
        ]
      },
      {
        voucherType: 'EGRESO',
        description: 'Pago de arrendamiento de oficina',
        date: new Date('2024-01-31'),
        details: [
          { accountId: accountMap.get('511005')?.id, debit: 2000000, credit: 0, description: 'Arrendamiento mensual' },
          { accountId: accountMap.get('110505')?.id, debit: 0, credit: 2000000, description: 'Pago de arrendamiento' },
        ]
      }
    ]

    const createdTransactions = []
    for (const transData of demoTransactions) {
      // Obtener el periodo contable
      const period = await db.accountingPeriod.findFirst({
        where: {
          companyId: decoded.companyId,
          year: transData.date.getFullYear(),
          month: transData.date.getMonth() + 1,
          status: 'OPEN'
        }
      })

      if (period) {
        // Generar número de comprobante
        const lastTransaction = await db.transaction.findFirst({
          where: {
            companyId: decoded.companyId,
            voucherType: transData.voucherType,
          },
          orderBy: { voucherNumber: 'desc' }
        })

        const voucherNumber = lastTransaction 
          ? (parseInt(lastTransaction.voucherNumber) + 1).toString().padStart(6, '0')
          : '000001'

        const totalDebit = transData.details.reduce((sum, detail) => sum + detail.debit, 0)
        const totalCredit = transData.details.reduce((sum, detail) => sum + detail.credit, 0)

        const transaction = await db.transaction.create({
          data: {
            companyId: decoded.companyId,
            voucherType: transData.voucherType,
            voucherNumber,
            description: transData.description,
            date: transData.date,
            totalDebit,
            totalCredit,
            status: 'POSTED',
            createdBy: decoded.userId,
            periodId: period.id,
            details: {
              create: transData.details.map(detail => ({
                accountId: detail.accountId,
                description: detail.description,
                debit: detail.debit,
                credit: detail.credit,
              }))
            }
          }
        })
        createdTransactions.push(transaction)
      }
    }

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entityType: 'DEMO_DATA',
        entityId: decoded.companyId,
        newValues: JSON.stringify({
          thirdParties: createdThirdParties.length,
          transactions: createdTransactions.length
        }),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Datos de demostración creados exitosamente en la base de datos',
      createdThirdParties: createdThirdParties.length,
      createdTransactions: createdTransactions.length,
    })

  } catch (error) {
    console.error('Error creando datos de demo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}