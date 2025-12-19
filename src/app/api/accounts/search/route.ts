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
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json({ accounts: [] })
    }

    const accounts = await db.chartOfAccounts.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
        OR: [
          {
            code: {
              contains: query,
            },
          },
          {
            name: {
              contains: query,
            },
          },
        ],
      },
      orderBy: [{ code: 'asc' }],
      take: 50,
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
      hasChildren: false,
    }))

    return NextResponse.json({ accounts: nodes })
  } catch (error) {
    console.error('Error en búsqueda de cuentas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
