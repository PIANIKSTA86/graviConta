import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Create demo company
    const company = await prisma.company.upsert({
        where: { nit: '900123456-7' },
        update: {},
        create: {
            nit: '900123456-7',
            name: 'GraviConta Demo S.A.S',
            commercialName: 'GraviConta Demo',
            address: 'Calle 100 # 20-30, Bogotá',
            phone: '+57 1 234 5678',
            email: 'contacto@gravicontademo.com',
            regime: 'COMUN',
            type: 'PERSONA_JURIDICA',
            isActive: true,
        },
    })

    console.log('✅ Company created:', company.name)

    // Create demo user with hashed password
    const hashedPassword = await bcrypt.hash('demo123', 10)

    const user = await prisma.user.upsert({
        where: { email: 'demo@graviconta.com' },
        update: {},
        create: {
            email: 'demo@graviconta.com',
            name: 'Usuario Demo',
            password: hashedPassword,
            role: 'ADMIN',
            companyId: company.id,
            isActive: true,
        },
    })

    console.log('✅ User created:', user.email)

    // Create current accounting period
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const period = await prisma.accountingPeriod.upsert({
        where: {
            companyId_year_month: {
                companyId: company.id,
                year,
                month,
            },
        },
        update: {},
        create: {
            companyId: company.id,
            year,
            month,
            status: 'OPEN',
            openingDate: new Date(year, month - 1, 1),
        },
    })

    console.log(`✅ Accounting period created: ${year}-${month}`)

    // Initialize PUC (Plan Único de Cuentas)
    const pucAccounts = [
        // ACTIVOS
        { code: '1', name: 'ACTIVO', level: 1, nature: 'DEUDORA', accountType: 'ACTIVO', allowsMovement: false },
        { code: '11', name: 'ACTIVO CORRIENTE', level: 2, nature: 'DEUDORA', accountType: 'ACTIVO', parentCode: '1', allowsMovement: false },
        { code: '1105', name: 'CAJA', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO', parentCode: '11', allowsMovement: false },
        { code: '110505', name: 'Caja General', level: 6, nature: 'DEUDORA', accountType: 'ACTIVO', parentCode: '1105', isAuxiliary: true },
        { code: '1110', name: 'BANCOS', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO', parentCode: '11', allowsMovement: false },
        { code: '111005', name: 'Bancos Nacionales', level: 6, nature: 'DEUDORA', accountType: 'ACTIVO', parentCode: '1110', isAuxiliary: true },
        { code: '1305', name: 'CLIENTES', level: 4, nature: 'DEUDORA', accountType: 'ACTIVO', parentCode: '11', allowsMovement: false },
        { code: '130505', name: 'Clientes Nacionales', level: 6, nature: 'DEUDORA', accountType: 'ACTIVO', parentCode: '1305', isAuxiliary: true },

        // PASIVOS
        { code: '2', name: 'PASIVO', level: 1, nature: 'ACREEDORA', accountType: 'PASIVO', allowsMovement: false },
        { code: '21', name: 'PASIVO CORRIENTE', level: 2, nature: 'ACREEDORA', accountType: 'PASIVO', parentCode: '2', allowsMovement: false },
        { code: '2205', name: 'PROVEEDORES', level: 4, nature: 'ACREEDORA', accountType: 'PASIVO', parentCode: '21', allowsMovement: false },
        { code: '220505', name: 'Proveedores Nacionales', level: 6, nature: 'ACREEDORA', accountType: 'PASIVO', parentCode: '2205', isAuxiliary: true },
        { code: '2335', name: 'IMPUESTOS POR PAGAR', level: 4, nature: 'ACREEDORA', accountType: 'PASIVO', parentCode: '21', allowsMovement: false },
        { code: '233505', name: 'IVA por Pagar', level: 6, nature: 'ACREEDORA', accountType: 'PASIVO', parentCode: '2335', isAuxiliary: true },

        // PATRIMONIO
        { code: '3', name: 'PATRIMONIO', level: 1, nature: 'ACREEDORA', accountType: 'PATRIMONIO', allowsMovement: false },
        { code: '31', name: 'CAPITAL SOCIAL', level: 2, nature: 'ACREEDORA', accountType: 'PATRIMONIO', parentCode: '3', allowsMovement: false },
        { code: '3115', name: 'APORTES SOCIALES', level: 4, nature: 'ACREEDORA', accountType: 'PATRIMONIO', parentCode: '31', allowsMovement: false },
        { code: '311505', name: 'Capital Suscrito y Pagado', level: 6, nature: 'ACREEDORA', accountType: 'PATRIMONIO', parentCode: '3115', isAuxiliary: true },
        { code: '36', name: 'RESULTADOS DEL EJERCICIO', level: 2, nature: 'ACREEDORA', accountType: 'PATRIMONIO', parentCode: '3', allowsMovement: false },
        { code: '3605', name: 'UTILIDADES ACUMULADAS', level: 4, nature: 'ACREEDORA', accountType: 'PATRIMONIO', parentCode: '36', allowsMovement: false },
        { code: '360505', name: 'Utilidades no Distribuidas', level: 6, nature: 'ACREEDORA', accountType: 'PATRIMONIO', parentCode: '3605', isAuxiliary: true },

        // INGRESOS
        { code: '4', name: 'INGRESOS', level: 1, nature: 'ACREEDORA', accountType: 'INGRESOS', allowsMovement: false },
        { code: '41', name: 'INGRESOS OPERACIONALES', level: 2, nature: 'ACREEDORA', accountType: 'INGRESOS', parentCode: '4', allowsMovement: false },
        { code: '4135', name: 'COMERCIO AL POR MAYOR Y AL POR MENOR', level: 4, nature: 'ACREEDORA', accountType: 'INGRESOS', parentCode: '41', allowsMovement: false },
        { code: '413505', name: 'Ventas de Mercancías', level: 6, nature: 'ACREEDORA', accountType: 'INGRESOS', parentCode: '4135', isAuxiliary: true },

        // GASTOS
        { code: '5', name: 'GASTOS', level: 1, nature: 'DEUDORA', accountType: 'GASTOS', allowsMovement: false },
        { code: '51', name: 'GASTOS OPERACIONALES DE ADMINISTRACIÓN', level: 2, nature: 'DEUDORA', accountType: 'GASTOS', parentCode: '5', allowsMovement: false },
        { code: '5105', name: 'GASTOS DE PERSONAL', level: 4, nature: 'DEUDORA', accountType: 'GASTOS', parentCode: '51', allowsMovement: false },
        { code: '510506', name: 'Sueldos', level: 6, nature: 'DEUDORA', accountType: 'GASTOS', parentCode: '5105', isAuxiliary: true },
        { code: '5135', name: 'SERVICIOS', level: 4, nature: 'DEUDORA', accountType: 'GASTOS', parentCode: '51', allowsMovement: false },
        { code: '513505', name: 'Arrendamientos', level: 6, nature: 'DEUDORA', accountType: 'GASTOS', parentCode: '5135', isAuxiliary: true },
    ]

    for (const account of pucAccounts) {
        await prisma.chartOfAccounts.upsert({
            where: { code: account.code },
            update: {},
            create: {
                ...account,
                companyId: company.id,
            },
        })
    }

    console.log(`✅ Created ${pucAccounts.length} PUC accounts`)

    // Create sample third parties
    const client = await prisma.thirdParty.upsert({
        where: { identificationNumber: '900111222-3' },
        update: {},
        create: {
            companyId: company.id,
            identificationType: 'NIT',
            identificationNumber: '900111222-3',
            name: 'Cliente ABC S.A.S',
            commercialName: 'ABC',
            address: 'Carrera 7 # 50-20',
            phone: '+57 1 111 2222',
            email: 'contacto@abc.com',
            city: 'Bogotá',
            department: 'Cundinamarca',
            type: 'CUSTOMER',
            taxRegime: 'COMUN',
            fiscalResponsibilities: JSON.stringify(['IVA', 'RETEFUENTE']),
        },
    })

    const supplier = await prisma.thirdParty.upsert({
        where: { identificationNumber: '900333444-5' },
        update: {},
        create: {
            companyId: company.id,
            identificationType: 'NIT',
            identificationNumber: '900333444-5',
            name: 'Proveedor XYZ Ltda',
            commercialName: 'XYZ',
            address: 'Calle 80 # 10-15',
            phone: '+57 1 333 4444',
            email: 'ventas@xyz.com',
            city: 'Medellín',
            department: 'Antioquia',
            type: 'SUPPLIER',
            taxRegime: 'COMUN',
            fiscalResponsibilities: JSON.stringify(['IVA']),
        },
    })

    console.log('✅ Created sample third parties')

    // Create sample transactions
    const transaction1 = await prisma.transaction.create({
        data: {
            companyId: company.id,
            voucherType: 'INGRESO',
            voucherNumber: 'CI-2025-001',
            description: 'Venta de mercancías - Cliente ABC',
            date: new Date(),
            totalDebit: 1250000,
            totalCredit: 1250000,
            status: 'POSTED',
            createdBy: user.id,
            approvedBy: user.id,
            approvedAt: new Date(),
            periodId: period.id,
            thirdPartyId: client.id,
            details: {
                create: [
                    {
                        accountId: (await prisma.chartOfAccounts.findUnique({ where: { code: '111005' } }))!.id,
                        description: 'Pago en banco',
                        debit: 1250000,
                        credit: 0,
                    },
                    {
                        accountId: (await prisma.chartOfAccounts.findUnique({ where: { code: '413505' } }))!.id,
                        description: 'Venta de mercancías',
                        debit: 0,
                        credit: 1250000,
                    },
                ],
            },
        },
    })

    const transaction2 = await prisma.transaction.create({
        data: {
            companyId: company.id,
            voucherType: 'EGRESO',
            voucherNumber: 'CE-2025-001',
            description: 'Pago de nómina',
            date: new Date(Date.now() - 86400000 * 2), // 2 days ago
            totalDebit: 3500000,
            totalCredit: 3500000,
            status: 'POSTED',
            createdBy: user.id,
            approvedBy: user.id,
            approvedAt: new Date(),
            periodId: period.id,
            details: {
                create: [
                    {
                        accountId: (await prisma.chartOfAccounts.findUnique({ where: { code: '510506' } }))!.id,
                        description: 'Sueldos del mes',
                        debit: 3500000,
                        credit: 0,
                    },
                    {
                        accountId: (await prisma.chartOfAccounts.findUnique({ where: { code: '111005' } }))!.id,
                        description: 'Pago desde banco',
                        debit: 0,
                        credit: 3500000,
                    },
                ],
            },
        },
    })

    console.log('✅ Created sample transactions')

    console.log('🎉 Database seeding completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
