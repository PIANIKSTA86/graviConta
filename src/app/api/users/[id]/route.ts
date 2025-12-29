import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN','ACCOUNTANT','MANAGER','USER']).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const current = await getCurrentUser(request)
    if (!current) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (current.role !== 'ADMIN') return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })

    const id = params.id
    const existing = await db.user.findFirst({ where: { id, companyId: current.companyId } })
    if (!existing) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    let password: string | undefined
    if (data.password) {
      password = await bcrypt.hash(data.password, 10)
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        email: data.email ?? existing.email,
        role: data.role ?? existing.role,
        isActive: data.isActive ?? existing.isActive,
        ...(password ? { password } : {}),
      },
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

    await db.auditLog.create({
      data: {
        userId: current.userId,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: id,
        oldValues: JSON.stringify({ id: existing.id, name: existing.name, email: existing.email, role: existing.role, isActive: existing.isActive }),
        newValues: JSON.stringify(updated),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({ message: 'Usuario actualizado', user: updated })
  } catch (error) {
    console.error('PUT /api/users/[id] error', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const current = await getCurrentUser(request)
    if (!current) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (current.role !== 'ADMIN') return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })

    const id = params.id
    const existing = await db.user.findFirst({ where: { id, companyId: current.companyId } })
    if (!existing) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const updated = await db.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    })

    await db.auditLog.create({
      data: {
        userId: current.userId,
        action: 'DELETE',
        entityType: 'USER',
        entityId: id,
        oldValues: JSON.stringify({ id: existing.id, isActive: existing.isActive }),
        newValues: JSON.stringify(updated),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({ message: 'Usuario desactivado', user: updated })
  } catch (error) {
    console.error('DELETE /api/users/[id] error', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
