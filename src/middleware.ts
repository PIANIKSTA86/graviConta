import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Only protect API routes, not the dashboard pages
    // Let the client-side handle dashboard authentication
    if (pathname.startsWith('/api/dashboard') || pathname.startsWith('/api/auth/me')) {
        const token = request.cookies.get('auth-token')?.value

        if (!token) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/api/dashboard/:path*', '/api/auth/me']
}
