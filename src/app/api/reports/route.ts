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
    const reportType = searchParams.get('type')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null

    let dateFilter: any = {
      year,
    }

    if (month) {
      dateFilter.month = month
    }

    // Obtener periodo contable desde la base de datos
    const period = await db.accountingPeriod.findFirst({
      where: {
        companyId: decoded.companyId,
        ...dateFilter,
      }
    })

    if (!period) {
      return NextResponse.json(
        { error: 'No se encontró el periodo contable especificado en la base de datos' },
        { status: 404 }
      )
    }

    switch (reportType) {
      case 'trial_balance':
        return await generateTrialBalance(decoded.companyId, period.id)
      
      case 'balance_sheet':
        return await generateBalanceSheet(decoded.companyId, period.id)
      
      case 'income_statement':
        return await generateIncomeStatement(decoded.companyId, period.id)
      
      default:
        return NextResponse.json(
          { error: 'Tipo de reporte no válido' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error generando reporte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

async function generateTrialBalance(companyId: string, periodId: string) {
  // Obtener todas las transacciones del periodo desde la base de datos
  const transactions = await db.transactionDetail.findMany({
    where: {
      transaction: {
        companyId,
        periodId,
        status: 'POSTED'
      }
    },
    include: {
      account: {
        select: {
          id: true,
          code: true,
          name: true,
          nature: true,
          accountType: true,
        }
      }
    }
  })

  // Agrupar por cuenta
  const accountBalances = new Map()

  transactions.forEach(detail => {
    const accountId = detail.accountId
    if (!accountBalances.has(accountId)) {
      accountBalances.set(accountId, {
        account: detail.account,
        debit: 0,
        credit: 0,
      })
    }

    const balance = accountBalances.get(accountId)
    balance.debit += detail.debit
    balance.credit += detail.credit
  })

  // Calcular saldos finales
  const trialBalance = Array.from(accountBalances.values()).map(item => {
    const { account, debit, credit } = item
    
    let finalDebit = 0
    let finalCredit = 0

    if (account.nature === 'DEUDORA') {
      finalDebit = debit - credit
      if (finalDebit < 0) {
        finalCredit = Math.abs(finalDebit)
        finalDebit = 0
      }
    } else {
      finalCredit = credit - debit
      if (finalCredit < 0) {
        finalDebit = Math.abs(finalCredit)
        finalCredit = 0
      }
    }

    return {
      account,
      debit,
      credit,
      finalDebit,
      finalCredit,
    }
  })

  // Ordenar por código de cuenta
  trialBalance.sort((a, b) => a.account.code.localeCompare(b.account.code))

  const totalDebit = trialBalance.reduce((sum, item) => sum + item.finalDebit, 0)
  const totalCredit = trialBalance.reduce((sum, item) => sum + item.finalCredit, 0)

  return NextResponse.json({
    reportType: 'trial_balance',
    data: trialBalance,
    totals: {
      debit: totalDebit,
      credit: totalCredit,
    }
  })
}

async function generateBalanceSheet(companyId: string, periodId: string) {
  // Obtener balances de cuentas desde la base de datos
  const transactions = await db.transactionDetail.findMany({
    where: {
      transaction: {
        companyId,
        periodId,
        status: 'POSTED'
      }
    },
    include: {
      account: {
        select: {
          id: true,
          code: true,
          name: true,
          nature: true,
          accountType: true,
        }
      }
    }
  })

  const accountBalances = new Map()

  transactions.forEach(detail => {
    const accountId = detail.accountId
    if (!accountBalances.has(accountId)) {
      accountBalances.set(accountId, {
        account: detail.account,
        balance: 0,
      })
    }

    const balance = accountBalances.get(accountId)
    
    if (detail.account.nature === 'DEUDORA') {
      balance.balance += detail.debit - detail.credit
    } else {
      balance.balance += detail.credit - detail.debit
    }
  })

  // Agrupar por tipo de cuenta
  const assets = []
  const liabilities = []
  const equity = []

  accountBalances.forEach(item => {
    const { account, balance } = item
    
    const accountData = {
      code: account.code,
      name: account.name,
      balance: Math.abs(balance),
    }

    switch (account.accountType) {
      case 'ACTIVO':
        assets.push(accountData)
        break
      case 'PASIVO':
        liabilities.push(accountData)
        break
      case 'PATRIMONIO':
        equity.push(accountData)
        break
    }
  })

  const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0)
  const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0)

  return NextResponse.json({
    reportType: 'balance_sheet',
    data: {
      assets: {
        accounts: assets,
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilities,
        total: totalLiabilities,
      },
      equity: {
        accounts: equity,
        total: totalEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    }
  })
}

async function generateIncomeStatement(companyId: string, periodId: string) {
  // Obtener transacciones de ingresos y gastos desde la base de datos
  const transactions = await db.transactionDetail.findMany({
    where: {
      transaction: {
        companyId,
        periodId,
        status: 'POSTED'
      },
      account: {
        accountType: {
          in: ['INGRESOS', 'GASTOS']
        }
      }
    },
    include: {
      account: {
        select: {
          id: true,
          code: true,
          name: true,
          nature: true,
          accountType: true,
        }
      }
    }
  })

  const accountBalances = new Map()

  transactions.forEach(detail => {
    const accountId = detail.accountId
    if (!accountBalances.has(accountId)) {
      accountBalances.set(accountId, {
        account: detail.account,
        balance: 0,
      })
    }

    const balance = accountBalances.get(accountId)
    
    if (detail.account.accountType === 'INGRESOS') {
      // Los ingresos son naturaleza acreedora
      balance.balance += detail.credit - detail.debit
    } else {
      // Los gastos son naturaleza deudora
      balance.balance += detail.debit - detail.credit
    }
  })

  // Agrupar ingresos y gastos
  const revenues = []
  const expenses = []

  accountBalances.forEach(item => {
    const { account, balance } = item
    
    const accountData = {
      code: account.code,
      name: account.name,
      balance: Math.abs(balance),
    }

    if (account.accountType === 'INGRESOS') {
      revenues.push(accountData)
    } else {
      expenses.push(accountData)
    }
  })

  const totalRevenues = revenues.reduce((sum, item) => sum + item.balance, 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + item.balance, 0)
  const netIncome = totalRevenues - totalExpenses

  return NextResponse.json({
    reportType: 'income_statement',
    data: {
      revenues: {
        accounts: revenues,
        total: totalRevenues,
      },
      expenses: {
        accounts: expenses,
        total: totalExpenses,
      },
      netIncome,
    }
  })
}