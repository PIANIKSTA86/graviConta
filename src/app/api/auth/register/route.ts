import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(2),
  companyNit: z.string().min(5),
  companyRegime: z.enum(['COMUN', 'SIMPLIFICADO']),
  companyType: z.enum(['PERSONA_NATURAL', 'PERSONA_JURIDICA']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Verificar si el usuario ya existe en la base de datos
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 400 }
      )
    }

    // Verificar si la empresa ya existe en la base de datos
    const existingCompany = await db.company.findUnique({
      where: { nit: validatedData.companyNit }
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'La empresa ya está registrada' },
        { status: 400 }
      )
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Crear empresa en la base de datos
    const company = await db.company.create({
      data: {
        nit: validatedData.companyNit,
        name: validatedData.companyName,
        regime: validatedData.companyRegime,
        type: validatedData.companyType,
      }
    })

    // Crear usuario en la base de datos
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            nit: true,
          }
        }
      }
    })

    // Crear periodo contable inicial en la base de datos
    const currentDate = new Date()
    await db.accountingPeriod.create({
      data: {
        companyId: company.id,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        openingDate: currentDate,
      }
    })

    return NextResponse.json({
      message: 'Usuario y empresa creados exitosamente en la base de datos',
      user
    })

  } catch (error) {
    console.error('Error en registro:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}