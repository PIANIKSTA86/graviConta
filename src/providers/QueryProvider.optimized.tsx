/**
 * FASE 2 - ALTA PRIORIDAD: QueryProvider Optimizado con Persistencia
 * 
 * Reemplaza: src/providers/QueryProvider.tsx
 * 
 * Nuevas características:
 * 1. Persistencia en localStorage (datos disponibles offline)
 * 2. Configuración optimizada de staleTime y gcTime
 * 3. Manejo inteligente de errores
 * 4. Devtools en desarrollo
 * 
 * Instalar primero:
 * npm install @tanstack/react-query-persist-client
 */

"use client"

import { ReactNode, useState } from "react"
import {
    QueryClient,
    QueryClientProvider,
    DefaultError,
} from "@tanstack/react-query"
import {
    PersistQueryClientProvider,
    persistQueryClient,
} from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { useIsOnline } from "@/hooks/useIsOnline"

/**
 * Crear instancia del QueryClient con configuración optimizada
 */
const createQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // ✅ Stale time optimizado
                staleTime: 1000 * 60 * 5, // 5 minutos por default
                
                // ✅ Cache time optimizado
                gcTime: 1000 * 60 * 60, // 1 hora por default
                
                // ✅ Comportamiento optimizado
                retry: 1,
                refetchOnWindowFocus: false,
                refetchOnReconnect: "stale", // ✅ Refetch solo si stale cuando vuelve online
                refetchOnMount: false,
                
                // ✅ Manejo de errores
                throwOnError: false,
            },
            mutations: {
                retry: 0,
                throwOnError: false,
            },
        },
    })
}

/**
 * Persister basado en localStorage
 * Guarda queries en localStorage para recuperarlas después
 */
const createLocalStoragePersister = () => {
    if (typeof window === 'undefined') {
        return null
    }

    return createSyncStoragePersister({
        storage: window.localStorage,
    })
}

/**
 * Componente Provider con soporte de persistencia
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => createQueryClient())
    const [persister] = useState(() => createLocalStoragePersister())
    const isOnline = useIsOnline()

    if (!persister) {
        // ✅ Fallback en servidor
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        )
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 1000 * 60 * 60 * 24, // Persistir por 24 horas
                hydrateOptions: {
                    maxAge: 1000 * 60 * 60, // Considerar válidos datos en caché por 1 hora
                },
                // ✅ Configurar qué queries persistir
                shouldDehydrateQuery: (query) => {
                    const queryState = query.state
                    
                    // No persistir queries en error
                    if (queryState.status === "error") {
                        return false
                    }

                    // No persistir queries que no tienen data
                    if (!queryState.data) {
                        return false
                    }

                    // Persistir queries exitosas
                    return queryState.status === "success"
                },
            }}
        >
            {/* ✅ Agregar soporte de offline indicator (opcional) */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50 text-sm">
                    🔴 Sin conexión. Los datos se cargan desde caché.
                </div>
            )}

            {children}
        </PersistQueryClientProvider>
    )
}

/**
 * Hook para verificar si estamos online
 * (Necesita ser creado en src/hooks/useIsOnline.ts)
 */
// Ver archivo useIsOnline.ts a continuación
