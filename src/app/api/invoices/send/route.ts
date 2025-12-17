import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import ZAI from 'z-ai-web-dev-sdk'

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

    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      )
    }

    // Obtener factura con detalles desde la base de datos
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId: decoded.companyId,
      },
      include: {
        thirdParty: true,
        items: true,
        company: {
          select: {
            name: true,
            nit: true,
            address: true,
            phone: true,
            email: true,
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada en la base de datos' },
        { status: 404 }
      )
    }

    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'La factura ya ha sido procesada' },
        { status: 400 }
      )
    }

    // Simular envío a DIAN usando AI para generar CUNE
    const zai = await ZAI.create()
    
    const cuneResponse = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Genera un código único de factura electrónica (CUNE) válido para Colombia. El CUNE debe ser un UUID válido. Responde únicamente con el UUID, sin texto adicional.'
        },
        {
          role: 'user',
          content: `Genera un CUNE para la factura ${invoice.invoiceNumber} de la empresa ${invoice.company.name} con NIT ${invoice.company.nit} para el cliente ${invoice.thirdParty.name} con identificación ${invoice.thirdParty.identificationNumber} por un valor de ${invoice.total}.`
        }
      ],
      max_tokens: 50,
      temperature: 0.1,
    })

    const cune = cuneResponse.choices[0]?.message?.content?.trim()

    if (!cune) {
      return NextResponse.json(
        { error: 'Error generando CUNE' },
        { status: 500 }
      )
    }

    // Generar QR Code (simulado)
    const qrCode = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cune}`

    // Actualizar factura en la base de datos
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'SENT',
        cune,
        qrCode,
        xmlUrl: `https://api.dian.gov.co/xml/${cune}`,
        pdfUrl: `https://api.dian.gov.co/pdf/${cune}`,
      },
      include: {
        thirdParty: {
          select: {
            id: true,
            name: true,
            identificationNumber: true,
            email: true,
          }
        },
        items: true
      }
    })

    // Generar asiento contable automático
    const accounts = await db.chartOfAccounts.findMany({
      where: {
        companyId: decoded.companyId,
        code: {
          in: ['110505', '110610', '410505', '233505'] // Caja, Clientes, Ventas, IVA
        }
      }
    })

    const accountMap = new Map()
    accounts.forEach(account => {
      accountMap.set(account.code, account.id)
    })

    // Obtener periodo contable
    const period = await db.accountingPeriod.findFirst({
      where: {
        companyId: decoded.companyId,
        year: invoice.date.getFullYear(),
        month: invoice.date.getMonth() + 1,
        status: 'OPEN'
      }
    })

    if (period) {
      // Generar número de comprobante
      const lastTransaction = await db.transaction.findFirst({
        where: {
          companyId: decoded.companyId,
          voucherType: 'INGRESO',
        },
        orderBy: { voucherNumber: 'desc' }
      })

      const voucherNumber = lastTransaction 
        ? (parseInt(lastTransaction.voucherNumber) + 1).toString().padStart(6, '0')
        : '000001'

      // Crear comprobante contable en la base de datos
      await db.transaction.create({
        data: {
          companyId: decoded.companyId,
          voucherType: 'INGRESO',
          voucherNumber,
          description: `Factura de venta ${invoice.invoiceNumber} - ${invoice.thirdParty.name}`,
          date: invoice.date,
          totalDebit: invoice.total,
          totalCredit: invoice.total,
          status: 'POSTED',
          createdBy: decoded.userId,
          periodId: period.id,
          thirdPartyId: invoice.thirdPartyId,
          details: {
            create: [
              {
                accountId: accountMap.get('110610') || accountMap.get('110505'), // Clientes o Caja
                description: `Factura ${invoice.invoiceNumber} - ${invoice.thirdParty.name}`,
                debit: invoice.total,
                credit: 0,
              },
              {
                accountId: accountMap.get('410505'), // Ventas
                description: `Ingreso por ventas - Factura ${invoice.invoiceNumber}`,
                debit: 0,
                credit: invoice.subtotal,
              },
              {
                accountId: accountMap.get('233505'), // IVA por Pagar
                description: `IVA facturado - Factura ${invoice.invoiceNumber}`,
                debit: 0,
                credit: invoice.taxAmount,
              }
            ]
          }
        }
      })
    }

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE',
        entityType: 'INVOICE',
        entityId: invoiceId,
        oldValues: JSON.stringify({ status: 'DRAFT' }),
        newValues: JSON.stringify({ status: 'SENT', cune }),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Factura enviada exitosamente a la DIAN y guardada en la base de datos',
      invoice: updatedInvoice,
      cune,
      qrCode
    })

  } catch (error) {
    console.error('Error enviando factura a DIAN:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}