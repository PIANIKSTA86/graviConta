import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentCodeParam = searchParams.get('parentCode')
    const parentCode = parentCodeParam && parentCodeParam !== 'null' && parentCodeParam !== '' ? parentCodeParam : null

    const accounts = await db.chartOfAccounts.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
        parentCode: parentCode,
      },
      orderBy: [{ code: 'asc' }],
      include: {
        children: {
          where: { isActive: true },
          select: { id: true },
          take: 1,
        },
      },
    })

    const nodes = accounts.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      level: a.level,
      nature: a.nature,
      accountType: a.accountType,
      isAuxiliary: a.isAuxiliary,
      allowsMovement: a.allowsMovement,
      parentCode: a.parentCode,
      hasChildren: a.children.length > 0,
    }))

    return NextResponse.json({ nodes })
  } catch (error) {
    console.error('Error cargando cuentas (árbol):', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
