import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthUser {
    userId: string
    email: string
    role: string
    companyId: string
}

export function getTokenFromRequest(request: NextRequest): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }

    // Check cookies
    const token = request.cookies.get('auth-token')?.value
    return token || null
}

export function verifyToken(token: string): AuthUser | null {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthUser
    } catch (error) {
        return null
    }
}

export function createToken(user: AuthUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
    const token = getTokenFromRequest(request)
    if (!token) return null
    return verifyToken(token)
}
