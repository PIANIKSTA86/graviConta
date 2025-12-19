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

// PUC Colombiano básico para inicialización
const PUC_COLOMBIA = [
  // ACTIVO CORRIENTE
  { code: '1105', name: 'CAJA', level: 2, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '110505', name: 'Caja General', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '1106', name: 'BANCOS', level: 2, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '110605', name: 'Bancos Nacionales', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '1110', name: 'CUENTAS POR COBRAR', level: 2, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '111005', name: 'Clientes', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '1120', name: 'INVENTARIOS', level: 2, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '112005', name: 'Mercancías', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO' },
  
  // ACTIVO NO CORRIENTE
  { code: '1504', name: 'PROPIEDAD PLANTA Y EQUIPO', level: 2, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '150405', name: 'Terrenos', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '150410', name: 'Edificios', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '150415', name: 'Maquinaria y Equipo', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '150420', name: 'Equipo de Oficina', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO' },
  { code: '1592', name: 'DEPRECIACIÓN ACUMULADA', level: 2, nature: 'ACREEDORA', accountType: 'ACTIVO' },
  { code: '159205', name: 'Depreciación Edificios', level: 4, nature: 'ACREEDORA', accountType: 'ACTIVO' },
  { code: '159210', name: 'Depreciación Maquinaria', level: 4, nature: 'ACREEDORA', accountType: 'ACTIVO' },
  
  // PASIVO CORRIENTE
  { code: '2205', name: 'PROVEEDORES', level: 2, nature: 'ACREEDORA', accountType: 'PASIVO' },
  { code: '220505', name: 'Proveedores Nacionales', level: 4, nature: 'ACREEDORA', accountType: 'PASIVO' },
  { code: '2210', name: 'CUENTAS POR PAGAR', level: 2, nature: 'ACREEDORA', accountType: 'PASIVO' },
  { code: '221005', name: 'Impuestos por Pagar', level: 4, nature: 'ACREEDORA', accountType: 'PASIVO' },
  { code: '2335', name: 'IMPUESTOS, RETENCIONES Y CONTRIBUCIONES', level: 2, nature: 'ACREEDORA', accountType: 'PASIVO' },
  { code: '233505', name: 'IVA por Pagar', level: 4, nature: 'ACREEDORA', accountType: 'PASIVO' },
  { code: '233510', name: 'Retención en la Fuente por Pagar', level: 4, nature: 'ACREEDORA', accountType: 'PASIVO' },
  { code: '2365', name: 'OTRAS OBLIGACIONES', level: 2, nature: 'ACREEDORA', accountType: 'PASIVO' },
  { code: '236505', name: 'Préstamos Bancarios', level: 4, nature: 'ACREEDORA', accountType: 'PASIVO' },
  
  // PASIVO NO CORRIENTE
  { code: '2705', name: 'BONOS Y PAPELES COMERCIALES', level: 2, nature: 'ACREEDORA', accountType: 'PASIVO' },
  { code: '270505', name: 'Bonos en Circulación', level: 4, nature: 'ACREEDORA', accountType: 'PASIVO' },
  
  // PATRIMONIO
  { code: '3115', name: 'CAPITAL SOCIAL', level: 2, nature: 'ACREEDORA', accountType: 'PATRIMONIO' },
  { code: '311505', name: 'Capital Suscrito y Pagado', level: 4, nature: 'ACREEDORA', accountType: 'PATRIMONIO' },
  { code: '3205', name: 'SUPERAVIT DE CAPITAL', level: 2, nature: 'ACREEDORA', accountType: 'PATRIMONIO' },
  { code: '320505', name: 'Primas de Emisión', level: 4, nature: 'ACREEDORA', accountType: 'PATRIMONIO' },
  { code: '3305', name: 'RESERVAS', level: 2, nature: 'ACREEDORA', accountType: 'PATRIMONIO' },
  { code: '330505', name: 'Reserva Legal', level: 4, nature: 'ACREEDORA', accountType: 'PATRIMONIO' },
  { code: '3605', name: 'UTILIDADES ACUMULADAS', level: 2, nature: 'ACREEDORA', accountType: 'PATRIMONIO' },
  { code: '360505', name: 'Utilidades no Distribuidas', level: 4, nature: 'ACREEDORA', accountType: 'PATRIMONIO' },
  
  // INGRESOS
  { code: '4105', name: 'INGRESOS OPERACIONALES', level: 2, nature: 'ACREEDORA', accountType: 'INGRESOS' },
  { code: '410505', name: 'Ventas de Mercancías', level: 4, nature: 'ACREEDORA', accountType: 'INGRESOS' },
  { code: '410510', name: 'Servicios', level: 4, nature: 'ACREEDORA', accountType: 'INGRESOS' },
  { code: '4205', name: 'INGRESOS NO OPERACIONALES', level: 2, nature: 'ACREEDORA', accountType: 'INGRESOS' },
  { code: '420505', name: 'Intereses', level: 4, nature: 'ACREEDORA', accountType: 'INGRESOS' },
  
  // GASTOS
  { code: '5105', name: 'GASTOS DE PERSONAL', level: 2, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '510505', name: 'Sueldos y Salarios', level: 4, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '5110', name: 'GASTOS DE ADMINISTRACIÓN', level: 2, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '511005', name: 'Arrendamientos', level: 4, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '511010', name: 'Servicios Públicos', level: 4, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '511015', name: 'Honorarios', level: 4, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '5205', name: 'GASTOS DE VENTAS', level: 2, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '520505', name: 'Comisiones', level: 4, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '520510', name: 'Publicidad y Propaganda', level: 4, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '5305', name: 'GASTOS FINANCIEROS', level: 2, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '530505', name: 'Intereses', level: 4, nature: 'DEUDORA', accountType: 'GASTOS' },
  { code: '530510', name: 'Gastos Bancarios', level: 4, nature: 'DEUDORA', accountType: 'GASTOS' },
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
      // Verificar si ya existen cuentas para esta empresa en la base de datos
      const existingAccountsCount = await db.chartOfAccounts.count({
        where: { companyId: decoded.companyId }
      })

      if (existingAccountsCount === 0) {
        // Inicializar PUC colombiano en la base de datos
        const accounts = PUC_COLOMBIA.map(account => ({
          ...account,
          companyId: decoded.companyId,
          parentCode: account.code.length > 4 ? account.code.substring(0, account.code.length - 1) : null,
          isAuxiliary: account.level >= 4,
          allowsMovement: account.level >= 3,
        }))

        await db.chartOfAccounts.createMany({
          data: accounts
        })
      }
    }

    // Obtener cuentas desde la base de datos
    const accounts = await db.chartOfAccounts.findMany({
      where: { 
        companyId: decoded.companyId,
        isActive: true 
      },
      orderBy: [
        { level: 'asc' },
        { code: 'asc' }
      ]
    })

    return NextResponse.json({ accounts })

  } catch (error) {
    console.error('Error obteniendo cuentas:', error)
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
    const { 
      code, 
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

    if (!code || !name || !nature || !accountType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el código ya existe en la base de datos
    const existingAccount = await db.chartOfAccounts.findFirst({
      where: {
        companyId: decoded.companyId,
        code
      }
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'El código de cuenta ya existe' },
        { status: 400 }
      )
    }

    // Calcular nivel basado en la longitud del código
    const level = code.length

    // Resolver cuenta de cierre si se envía código
    let closingAccountId: string | null = null
    if (closingAccountCode) {
      const closing = await db.chartOfAccounts.findFirst({
        where: { companyId: decoded.companyId, code: closingAccountCode }
      })
      closingAccountId = closing?.id ?? null
    }

    // Crear cuenta en la base de datos
    const account = await db.chartOfAccounts.create({
      data: {
        companyId: decoded.companyId,
        code,
        name,
        level,
        nature,
        accountType,
        parentCode,
        isAuxiliary: level >= 4,
        allowsMovement: level >= 3,
        isTemplate: Boolean(isTemplate ?? false),
        requiresCostCenter: Boolean(requiresCostCenter ?? false),
        appliesWithholding: Boolean(appliesWithholding ?? false),
        appliesTaxes: Boolean(appliesTaxes ?? false),
        niifCode: niifCode ?? null,
        closingAccountId,
      }
    })

    // Crear auditoría
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entityType: 'ACCOUNT',
        entityId: account.id,
        newValues: JSON.stringify(account),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Cuenta creada exitosamente en la base de datos',
      account
    })

  } catch (error) {
    console.error('Error creando cuenta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}