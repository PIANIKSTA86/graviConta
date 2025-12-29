import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN','ACCOUNTANT','MANAGER','USER']).default('USER'),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentUser(request)
    if (!current) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '20')
    const search = (searchParams.get('search') || '').trim()
    const status = searchParams.get('status') || 'ACTIVE' // ACTIVE | INACTIVE | ALL
    const role = searchParams.get('role') || ''

    const where: any = {
      companyId: current.companyId,
    }
    if (status !== 'ALL') where.isActive = status === 'ACTIVE'
    if (role) where.role = role
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const total = await db.user.count({ where })
    const users = await db.user.findMany({
      where,
      orderBy: [{ name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ users, pagination: { total, pages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (error) {
    console.error('GET /api/users error', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser(request)
    if (!current) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (current.role !== 'ADMIN') return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })

    const body = await request.json()
    const data = createUserSchema.parse(body)

    const existing = await db.user.findUnique({ where: { email: data.email } })
    if (existing) return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        companyId: current.companyId,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    await db.auditLog.create({
      data: {
        userId: current.userId,
        action: 'CREATE',
        entityType: 'USER',
        entityId: user.id,
        newValues: JSON.stringify(user),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({ message: 'Usuario creado', user })
  } catch (error) {
    console.error('POST /api/users error', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
