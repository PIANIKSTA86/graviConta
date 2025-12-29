// Test script para verificar CRUD de Tipos de Comprobantes
const testVoucherTypes = async () => {
  try {
    console.log('🧪 Test: CRUD de Tipos de Comprobantes\n')

    // Step 1: Login
    console.log('1️⃣  Realizando login...')
    let loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@graviconta.com',
        password: 'demo123'
      })
    })

    if (!loginRes.ok) {
      console.error('❌ Login falló:', loginRes.status)
      return
    }

    let loginData = await loginRes.json()
    const token = loginData.token
    console.log('✅ Login exitoso. Token recibido.\n')

    // Step 2: Crear un tipo de comprobante
    console.log('2️⃣  Creando tipo de comprobante (INGRESO)...')
    let createRes = await fetch('http://localhost:3000/api/voucher-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: 'ING',
        name: 'Comprobante de Ingreso',
        prefix: 'ING-',
        isActive: true
      })
    })

    let createData = await createRes.json()
    if (!createRes.ok) {
      console.error('❌ Crear falló:', createRes.status, createData)
    } else {
      console.log('✅ Tipo de comprobante creado:', createData.voucherType?.id)
      console.log('   Código:', createData.voucherType?.code)
      console.log('   Prefijo:', createData.voucherType?.prefix)
      console.log('   Consecutivo inicial:', createData.voucherType?.currentConsecutive)
    }

    // Step 3: Listar tipos de comprobantes
    console.log('\n3️⃣  Listando tipos de comprobantes...')
    let listRes = await fetch('http://localhost:3000/api/voucher-types?page=1&limit=10', {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    let listData = await listRes.json()
    if (listRes.ok) {
      console.log(`✅ Listado obtenido: ${listData.voucherTypes?.length || 0} tipos de comprobantes`)
      listData.voucherTypes?.forEach((vt) => {
        console.log(`   - ${vt.code}: ${vt.name} (Prefijo: ${vt.prefix || 'N/A'}, Consecutivo: ${vt.currentConsecutive})`)
      })
    } else {
      console.error('❌ Listar falló:', listRes.status)
    }

    // Step 4: Crear una transacción para probar el consumo de consecutivo
    console.log('\n4️⃣  Creando transacción para probar numeración...')
    
    // Primero obtenemos un período abierto
    let periodsRes = await fetch('http://localhost:3000/api/periods?status=OPEN', {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    let periodsData = await periodsRes.json()
    let period = periodsData.periods?.[0]

    if (!period) {
      console.log('⚠️  No hay períodos abiertos. Saltando prueba de transacción.')
    } else {
      let txRes = await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          voucherType: 'ING',
          description: 'Ingreso de prueba',
          date: new Date().toISOString(),
          periodId: period.id,
          details: [
            { accountId: 'ACC001', debit: 100, credit: 0, description: 'Entrada de prueba' }
          ]
        })
      })

      let txData = await txRes.json()
      if (txRes.ok) {
        console.log('✅ Transacción creada exitosamente')
        console.log('   Número de comprobante:', txData.transaction?.voucherNumber)
      } else {
        console.log('⚠️  Error creando transacción:', txData.error)
      }
    }

    console.log('\n✅ Pruebas completadas.')
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

testVoucherTypes()
