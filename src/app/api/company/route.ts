import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const companySchema = z.object({
  commercialName: z.string().optional(),
  documentType: z.string().optional(),
  verificationDigit: z.number().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  country: z.string().optional(),
  department: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  email2: z.string().email().optional().nullable(),
  logo: z.string().optional().nullable(),
  economicActivity: z.string().optional().nullable(),
  contributorType: z.string().optional(),
  taxRegime: z.string().optional(),
  useLogoInDocuments: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const company = await db.company.findUnique({
      where: { id: user.companyId },
      select: {
        id: true,
        nit: true,
        name: true,
        commercialName: true,
        documentType: true,
        verificationDigit: true,
        firstName: true,
        lastName: true,
        country: true,
        department: true,
        city: true,
        address: true,
        phone: true,
        mobile: true,
        email: true,
        email2: true,
        logo: true,
        economicActivity: true,
        contributorType: true,
        taxRegime: true,
        useLogoInDocuments: true,
        regime: true,
        type: true,
      }
    })

    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    return NextResponse.json(company)
  } catch (error) {
    console.error('Error obteniendo empresa:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const data = companySchema.parse(body)

    // Validaciones condicionales
    const isPersonaNatural = data.documentType && ['11', '12', '13', '21', '22'].includes(data.documentType)
    
    if (isPersonaNatural) {
      if (!data.firstName || !data.lastName) {
        return NextResponse.json(
          { error: 'Para personas naturales, nombres y apellidos son requeridos' },
          { status: 400 }
        )
      }
    }

    if (data.country === 'Colombia' && !data.city) {
      return NextResponse.json(
        { error: 'Departamento y ciudad son requeridos para empresas en Colombia' },
        { status: 400 }
      )
    }

    const company = await db.company.update({
      where: { id: user.companyId },
      data: {
        commercialName: data.commercialName,
        documentType: data.documentType,
        verificationDigit: data.verificationDigit,
        firstName: data.firstName,
        lastName: data.lastName,
        country: data.country,
        department: data.department,
        city: data.city,
        address: data.address,
        phone: data.phone,
        mobile: data.mobile,
        email: data.email,
        email2: data.email2,
        logo: data.logo,
        economicActivity: data.economicActivity,
        contributorType: data.contributorType,
        taxRegime: data.taxRegime,
        useLogoInDocuments: data.useLogoInDocuments,
      }
    })

    // Auditoría
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entityType: 'COMPANY',
        entityId: company.id,
        newValues: JSON.stringify(data),
        ipAddress: 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({ message: 'Empresa actualizada', company })
  } catch (error) {
    console.error('Error actualizando empresa:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
