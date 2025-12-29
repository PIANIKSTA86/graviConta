// Test API de Configuración Empresa
const testCompanyAPI = async () => {
  try {
    console.log('🧪 Test: API de Empresa\n')

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
    console.log('✅ Login exitoso\n')

    // Step 2: Obtener datos empresa
    console.log('2️⃣  Obteniendo datos de empresa...')
    let getRes = await fetch('http://localhost:3000/api/company', {
      headers: { Authorization: `Bearer ${token}` }
    })

    let companyData = await getRes.json()
    if (getRes.ok) {
      console.log('✅ Datos obtenidos:')
      console.log('   NIT:', companyData.nit)
      console.log('   Nombre:', companyData.name)
      console.log('   Comercial:', companyData.commercialName)
      console.log('   País:', companyData.country)
      console.log('   Ciudad:', companyData.city)
      console.log('   Teléfono:', companyData.phone)
      console.log('   Móvil:', companyData.mobile)
      console.log('   Email:', companyData.email)
      console.log('   Régimen Impuesto:', companyData.taxRegime)
      console.log('   Actividad Económica:', companyData.economicActivity)
    } else {
      console.error('❌ Obtener falló:', getRes.status, companyData)
      return
    }

    // Step 3: Actualizar datos empresa
    console.log('\n3️⃣  Actualizando datos de empresa...')
    let updateRes = await fetch('http://localhost:3000/api/company', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        commercialName: 'GraviConta Premium',
        mobile: '+57 300 999 8888',
        email2: 'soporte@graviconta.com',
        economicActivity: '6202',
        useLogoInDocuments: true
      })
    })

    let updateData = await updateRes.json()
    if (updateRes.ok) {
      console.log('✅ Datos actualizados:')
      console.log('   Comercial actualizado:', updateData.company.commercialName)
      console.log('   Móvil:', updateData.company.mobile)
      console.log('   Email 2:', updateData.company.email2)
    } else {
      console.error('❌ Actualizar falló:', updateRes.status, updateData)
      return
    }

    // Step 4: Verificar cambios
    console.log('\n4️⃣  Verificando cambios...')
    let verifyRes = await fetch('http://localhost:3000/api/company', {
      headers: { Authorization: `Bearer ${token}` }
    })

    let verifyData = await verifyRes.json()
    if (verifyRes.ok) {
      console.log('✅ Cambios confirmados:')
      console.log('   Comercial:', verifyData.commercialName)
      console.log('   Móvil:', verifyData.mobile)
      console.log('   Email 2:', verifyData.email2)
    }

    console.log('\n✅ Todas las pruebas pasaron.')
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

testCompanyAPI()
