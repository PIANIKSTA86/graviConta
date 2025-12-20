import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const thirdPartyUpdateSchema = z.object({
  identificationType: z.enum(['CC', 'NIT', 'CE', 'TI']).optional(),
  identificationNumber: z.string().min(5).optional(),
  name: z.string().min(2).optional(),
  commercialName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  department: z.string().optional(),
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'BOTH']).optional(),
  taxRegime: z.enum(['COMUN', 'SIMPLIFICADO', 'GRAN_CONTRIBUYENTE']).optional(),
  isAutoRetainer: z.boolean().optional(),
  fiscalResponsibilities: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const thirdParty = await db.thirdParty.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
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
      }
    })

    if (!thirdParty) {
      return NextResponse.json(
        { error: 'Tercero no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(thirdParty)

  } catch (error) {
    console.error('Error obteniendo tercero:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = thirdPartyUpdateSchema.parse(body)

    // Verificar que el tercero existe y pertenece a la compañía
    const existingThirdParty = await db.thirdParty.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    })

    if (!existingThirdParty) {
      return NextResponse.json(
        { error: 'Tercero no encontrado' },
        { status: 404 }
      )
    }

    // Si se está actualizando el número de identificación, verificar que no exista otro tercero con ese número
    if (validatedData.identificationNumber && validatedData.identificationNumber !== existingThirdParty.identificationNumber) {
      const duplicate = await db.thirdParty.findFirst({
        where: {
          companyId: user.companyId,
          identificationNumber: validatedData.identificationNumber,
          id: { not: params.id }
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe otro tercero con esta identificación' },
          { status: 400 }
        )
      }
    }

    // Actualizar tercero
    const updatedThirdParty = await db.thirdParty.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entityType: 'THIRD_PARTY',
        entityId: updatedThirdParty.id,
        oldValues: JSON.stringify(existingThirdParty),
        newValues: JSON.stringify(updatedThirdParty),
        ipAddress: 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Tercero actualizado exitosamente',
      thirdParty: updatedThirdParty
    })

  } catch (error) {
    console.error('Error actualizando tercero:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el tercero existe y pertenece a la compañía
    const thirdParty = await db.thirdParty.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        transactions: true,
        invoices: true,
        supplierInvoices: true,
      }
    })

    if (!thirdParty) {
      return NextResponse.json(
        { error: 'Tercero no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si tiene transacciones, facturas o facturas de proveedor
    const hasTransactions = thirdParty.transactions.length > 0
    const hasInvoices = thirdParty.invoices.length > 0
    const hasSupplierInvoices = thirdParty.supplierInvoices.length > 0

    if (hasTransactions || hasInvoices || hasSupplierInvoices) {
      return NextResponse.json(
        { error: 'No se puede eliminar el tercero porque tiene transacciones, facturas o documentos asociados. Puede desactivarlo en su lugar.' },
        { status: 400 }
      )
    }

    // Eliminar tercero
    await db.thirdParty.delete({
      where: { id: params.id }
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE',
        entityType: 'THIRD_PARTY',
        entityId: thirdParty.id,
        oldValues: JSON.stringify(thirdParty),
        ipAddress: 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Tercero eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error eliminando tercero:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
