import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function getTokenFromRequest(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }

    // Also check cookies
    const token = request.cookies.get('auth-token')?.value
    return token || null
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

        const companyId = decoded.companyId

        // Get all accounts with their current balances
        const accounts = await db.chartOfAccounts.findMany({
            where: {
                companyId,
                isActive: true
            },
            include: {
                transactionDetails: {
                    include: {
                        transaction: true
                    }
                }
            }
        })

        // Calculate totals by account type
        let totalAssets = 0
        let totalLiabilities = 0
        let totalEquity = 0
        let totalIncome = 0
        let totalExpenses = 0

        accounts.forEach(account => {
            let balance = 0

            account.transactionDetails.forEach(detail => {
                if (detail.transaction.status === 'POSTED') {
                    if (account.nature === 'DEUDORA') {
                        balance += detail.debit - detail.credit
                    } else {
                        balance += detail.credit - detail.debit
                    }
                }
            })

            switch (account.accountType) {
                case 'ACTIVO':
                    totalAssets += balance
                    break
                case 'PASIVO':
                    totalLiabilities += balance
                    break
                case 'PATRIMONIO':
                    totalEquity += balance
                    break
                case 'INGRESOS':
                    totalIncome += balance
                    break
                case 'GASTOS':
                    totalExpenses += balance
                    break
            }
        })

        // Calculate cash flow (simplified: bank accounts balance)
        const cashAccounts = accounts.filter(a =>
            a.code.startsWith('1105') || a.code.startsWith('1110')
        )

        let cashFlow = 0
        cashAccounts.forEach(account => {
            account.transactionDetails.forEach(detail => {
                if (detail.transaction.status === 'POSTED') {
                    cashFlow += detail.debit - detail.credit
                }
            })
        })

        // Calculate net income
        const netIncome = totalIncome - totalExpenses

        // For demo purposes, calculate mock percentage changes
        // In production, you would compare with previous period
        const metrics = {
            totalAssets: {
                value: totalAssets,
                change: 12.5,
                trend: 'up' as const
            },
            totalLiabilities: {
                value: totalLiabilities,
                change: 4.3,
                trend: 'up' as const
            },
            equity: {
                value: totalEquity,
                change: 18.2,
                trend: 'up' as const
            },
            cashFlow: {
                value: cashFlow,
                change: cashFlow > 0 ? 8.5 : -2.1,
                trend: (cashFlow > 0 ? 'up' : 'down') as const
            },
            netIncome: {
                value: netIncome,
                change: netIncome > 0 ? 15.3 : -5.2,
                trend: (netIncome > 0 ? 'up' : 'down') as const
            }
        }

        return NextResponse.json({ metrics })

    } catch (error) {
        console.error('Error obteniendo métricas:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
