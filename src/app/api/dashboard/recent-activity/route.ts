import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function getTokenFromRequest(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }

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

        // Get recent transactions with details
        const transactions = await db.transaction.findMany({
            where: {
                companyId,
                status: 'POSTED'
            },
            include: {
                thirdParty: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            },
            take: 10
        })

        const activity = transactions.map(transaction => ({
            id: transaction.id,
            type: getTransactionTypeLabel(transaction.voucherType),
            description: `${transaction.voucherNumber} - ${transaction.thirdParty?.name || transaction.description}`,
            amount: Math.max(transaction.totalDebit, transaction.totalCredit),
            date: formatRelativeDate(transaction.date),
            status: transaction.status === 'POSTED' ? 'completed' : 'pending'
        }))

        return NextResponse.json({ activity })

    } catch (error) {
        console.error('Error obteniendo actividad reciente:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

function getTransactionTypeLabel(voucherType: string): string {
    const labels: Record<string, string> = {
        'INGRESO': 'Comprobante de Ingreso',
        'EGRESO': 'Comprobante de Egreso',
        'TRASLADO': 'Comprobante de Traslado',
        'DIARIO': 'Comprobante Diario'
    }
    return labels[voucherType] || voucherType
}

function formatRelativeDate(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) {
        return 'Hace menos de 1 hora'
    } else if (diffHours < 24) {
        return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    } else if (diffDays === 1) {
        return 'Ayer'
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`
    } else {
        return new Date(date).toLocaleDateString('es-CO')
    }
}
