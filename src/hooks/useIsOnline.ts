/**
 * Hook para detectar conectividad online/offline
 * 
 * Usado por QueryProvider para mostrar indicadores y gestionar caché
 */

"use client"

import { useEffect, useState } from 'react'

/**
 * Hook que retorna si el cliente está online
 */
export function useIsOnline(): boolean {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        // Inicializar con el estado actual
        setIsOnline(navigator.onLine)

        // Listener para cuando va online
        const handleOnline = () => {
            setIsOnline(true)
            console.log('✅ Conexión restaurada')
        }

        // Listener para cuando va offline
        const handleOffline = () => {
            setIsOnline(false)
            console.log('⚠️ Sin conexión - usando caché')
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return isOnline
}
