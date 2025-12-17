// Test script para verificar el login API
const testLogin = async () => {
    try {
        console.log('🧪 Probando API de login...')
        console.log('URL: http://localhost:3000/api/auth/login')
        console.log('Credenciales: demo@graviconta.com / demo123\n')

        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'demo@graviconta.com',
                password: 'demo123'
            })
        })

        console.log('Status:', response.status, response.statusText)

        const data = await response.json()
        console.log('Response:', JSON.stringify(data, null, 2))

        if (response.ok) {
            console.log('\n✅ Login exitoso!')
            console.log('Token recibido:', data.token ? 'Sí' : 'No')
            console.log('Usuario:', data.user?.email)
        } else {
            console.log('\n❌ Login falló')
            console.log('Error:', data.error)
        }
    } catch (error) {
        console.error('\n❌ Error de conexión:', error.message)
    }
}

testLogin()
