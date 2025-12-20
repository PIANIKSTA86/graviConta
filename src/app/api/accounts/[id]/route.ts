import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { 
      name, 
      nature, 
      accountType, 
      parentCode,
      isTemplate,
      requiresCostCenter,
      appliesWithholding,
      appliesTaxes,
      niifCode,
      closingAccountCode,
    } = body

    if (!name || !nature || !accountType) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Verificar que la cuenta existe y pertenece a la empresa
    const existingAccount = await db.chartOfAccounts.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    })

    if (!existingAccount) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    // Resolver cuenta de cierre si se envía código
    let closingAccountId: string | null = null
    if (closingAccountCode) {
      const closing = await db.chartOfAccounts.findFirst({
        where: { companyId: user.companyId, code: closingAccountCode }
      })
      closingAccountId = closing?.id ?? null
    }

    // Actualizar cuenta
    const account = await db.chartOfAccounts.update({
      where: { id },
      data: {
        name,
        nature,
        accountType,
        parentCode: parentCode || null,
        isTemplate: Boolean(isTemplate ?? existingAccount.isTemplate),
        requiresCostCenter: Boolean(requiresCostCenter ?? existingAccount.requiresCostCenter),
        appliesWithholding: Boolean(appliesWithholding ?? existingAccount.appliesWithholding),
        appliesTaxes: Boolean(appliesTaxes ?? existingAccount.appliesTaxes),
        niifCode: niifCode ?? existingAccount.niifCode,
        closingAccountId,
      },
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entityType: 'ACCOUNT',
        entityId: account.id,
        oldValues: JSON.stringify(existingAccount),
        newValues: JSON.stringify(account),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      message: 'Cuenta actualizada exitosamente',
      account,
    })
  } catch (error) {
    console.error('Error actualizando cuenta:', error)
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
    const { action } = await request.json().catch(() => ({}))

    // Verificar que la cuenta existe y pertenece a la empresa
    const existingAccount = await db.chartOfAccounts.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        transactionDetails: true,
      },
    })

    if (!existingAccount) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    // Validar que no haya movimientos vigentes o saldo
    const hasActiveMovements = existingAccount.transactionDetails && existingAccount.transactionDetails.length > 0
    
    if (action === 'hard-delete') {
      // Eliminación física - solo si no tiene movimientos
      if (hasActiveMovements) {
        return NextResponse.json({
          error: 'No se puede eliminar la cuenta porque tiene movimientos asociados',
          hasMovements: true,
        }, { status: 400 })
      }

      // Eliminar física la cuenta
      await db.chartOfAccounts.delete({
        where: { id },
      })

      // Crear auditoría
      await db.auditLog.create({
        data: {
          userId: user.userId,
          action: 'DELETE',
          entityType: 'ACCOUNT',
          entityId: existingAccount.id,
          oldValues: JSON.stringify(existingAccount),
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })

      return NextResponse.json({
        message: 'Cuenta eliminada exitosamente',
      })
    } else {
      // Soft delete (desactivar) - solo si no tiene movimientos vigentes
      if (hasActiveMovements) {
        return NextResponse.json({
          error: 'No se puede desactivar la cuenta porque tiene movimientos asociados',
          hasMovements: true,
        }, { status: 400 })
      }

      // Marcar como inactiva
      const account = await db.chartOfAccounts.update({
        where: { id },
        data: {
          isActive: false,
        },
      })

      // Crear auditoría
      await db.auditLog.create({
        data: {
          userId: user.userId,
          action: 'DISABLE',
          entityType: 'ACCOUNT',
          entityId: account.id,
          oldValues: JSON.stringify(existingAccount),
          newValues: JSON.stringify(account),
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })

      return NextResponse.json({
        message: 'Cuenta desactivada exitosamente',
        account,
      })
    }
  } catch (error) {
    console.error('Error en operación de cuenta:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
