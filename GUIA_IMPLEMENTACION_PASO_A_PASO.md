# 🚀 GUÍA PASO A PASO - IMPLEMENTACIÓN DE OPTIMIZACIONES

## 📋 Antes de Comenzar

### ✅ Verificar el estado actual
```bash
# 1. Ir al directorio del proyecto
cd d:\Proyectos\graviConta

# 2. Verificar que todo esté limpio en git
git status

# 3. Crear rama para trabajar
git checkout -b feature/performance-optimization

# 4. Verificar la versión de Node
node --version  # Debe ser v18+ o v20+

# 5. Instalar dependencias si no están
npm install
```

---

## 📅 SEMANA 1: FASE CRÍTICA (Máximo impacto)

### Día 1️⃣: Preparación de Base de Datos

#### Paso 1.1: Crear migración de índices
```bash
# Generar nombre automático para la migración
npx prisma migrate dev --name add_critical_performance_indexes
```

Este comando:
1. Crea archivo en `prisma/migrations/[timestamp]_add_critical_performance_indexes/`
2. Ejecuta la migración en BD
3. Regenera el cliente de Prisma

#### Paso 1.2: Verificar índices creados
```bash
# Conectarse a MySQL
mysql -u root -p graviConta

# Listar índices creados
SHOW INDEX FROM chart_of_accounts;
SHOW INDEX FROM transactions;
SHOW INDEX FROM invoices;
```

**Esperado:** Ver 3-5 nuevos índices por tabla

#### Paso 1.3: Benchmark inicial
```bash
# Ejecutar test de perfor antes
npm run dev

# En otra terminal, medir tiempo de respuesta
curl -X GET http://localhost:3000/api/dashboard/metrics \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Accept: application/json"

# Anotar tiempo de respuesta (debería mejorar después)
```

---

### Día 2️⃣: Optimizar Endpoint de Dashboard Metrics

#### Paso 2.1: Respaldar archivo original
```bash
# Hacer backup del archivo original
copy src\app\api\dashboard\metrics\route.ts src\app\api\dashboard\metrics\route.backup.ts
```

#### Paso 2.2: Reemplazar con versión optimizada
```bash
# Copiar el archivo optimizado
copy src\app\api\dashboard\metrics\route.optimized.ts src\app\api\dashboard\metrics\route.ts
```

#### Paso 2.3: Actualizar código según tu BD
El archivo `route.optimized.ts` usa `$queryRaw`. Si tu BD es diferente:

```typescript
// Para PostgreSQL (en lugar de MySQL):
const balancesByType = await db.$queryRaw`
    SELECT 
        coa."accountType",
        coa."nature",
        SUM(...) as "totalBalance"
    FROM "chart_of_accounts" coa
    ...
`

// Para SQLite:
const balancesByType = await db.$queryRaw`
    SELECT 
        coa.accountType,
        coa.nature,
        SUM(...) as totalBalance
    FROM chart_of_accounts coa
    ...
`
```

#### Paso 2.4: Probar el endpoint
```bash
# Reiniciar servidor
npm run dev

# En otra terminal, medir nuevo tiempo
curl -X GET http://localhost:3000/api/dashboard/metrics \
  -H "Authorization: Bearer [TOKEN]"

# Tiempo esperado: 0.3-0.5 segundos (fue 5-8 segundos)
```

---

### Día 3️⃣: Optimizar React Query Hooks

#### Paso 3.1: Respaldar hooks originales
```bash
copy src\hooks\useQueries.ts src\hooks\useQueries.backup.ts
```

#### Paso 3.2: Reemplazar con versión optimizada
```bash
copy src\hooks\useQueries.optimized.ts src\hooks\useQueries.ts
```

#### Paso 3.3: Verificar cambios
```bash
# Abrir src/hooks/useQueries.ts y verificar:
# ✅ staleTime en 30+ minutos
# ✅ placeholderData agregado
# ✅ refetchOnMount: false
# ✅ gcTime en 60 minutos+

cat src\hooks\useQueries.ts | grep -i "staleTime\|gcTime\|placeholderData"
```

#### Paso 3.4: Probar en componentes
```bash
# Abrir navegador con DevTools (F12)
# Go to Application > Storage > Local Storage
# Navegar por la aplicación
# Verificar que las queries se cachen correctamente

# En consola, ver cache de React Query:
npm install @tanstack/react-query-devtools --save-dev
```

#### Paso 3.5: Agregar React Query DevTools (opcional, para desarrollo)
```typescript
// src/providers/QueryProvider.tsx (al final)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function ReactQueryProvider({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    )
}
```

---

### Día 4️⃣: Implementar Server-Side Rendering del Dashboard

#### Paso 4.1: Dividir componente Dashboard
**Antes:**
```typescript
// src/app/dashboard/page.tsx - "use client"
export default function DashboardPage() { ... }
```

**Después:**
```typescript
// src/app/dashboard/page.tsx - Server Component
export default async function DashboardPage() {
    const metrics = await fetch(...)
    return <DashboardContent initialMetrics={metrics} />
}

// src/components/dashboard/DashboardContent.tsx - Client Component
"use client"
export function DashboardContent({ initialMetrics }) { ... }
```

#### Paso 4.2: Crear archivos necesarios
```typescript
// src/components/dashboard/DashboardContent.tsx
"use client"

import React from 'react'

export function DashboardContent({ initialMetrics, children }) {
    return (
        <div className="space-y-6">
            {/* Usar initialMetrics directamente, sin fetch */}
            {/* ... resto del contenido */}
        </div>
    )
}
```

#### Paso 4.3: Actualizar page.tsx
```typescript
// src/app/dashboard/page.tsx
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
    // Fetch en servidor
    const metricsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/dashboard/metrics`,
        {
            headers: {
                'Authorization': `Bearer ${getServerToken()}`, // Implementar
            },
            cache: 'no-store'
        }
    )
    
    const metrics = await metricsResponse.json()

    return <DashboardContent initialMetrics={metrics} />
}
```

#### Paso 4.4: Pruebas
```bash
# Verificar que el dashboard carga más rápido
npm run dev

# Medir LCP (Largest Contentful Paint)
# F12 > Lighthouse > Generate report
# LCP debe ser < 2.5 segundos (antes era 5-8s)
```

---

### Día 5️⃣: Testing y Validación Semana 1

#### Test 1: Verificar performance de database
```bash
# En terminal MySQL/MariaDB
mysql -u root -p

# Medir tiempo de query con índices
SELECT SQL_NO_CACHE COUNT(*) FROM transactions WHERE companyId = '[ID]';

# Tiempo esperado: <100ms (antes: 1-2 segundos)
```

#### Test 2: Verificar caching de React Query
```typescript
// En consola del navegador
// Abrir Application > Storage > Local Storage
// Buscar: `persist:root` o `REACT_QUERY_OFFLINE_CACHE`

// Verificar que los datos estén cacheados
JSON.parse(localStorage.getItem('persist:root'))
```

#### Test 3: Lighthouse Audit
```bash
# Instalar Lighthouse CLI
npm install -g lighthouse

# Generar reporte
lighthouse http://localhost:3000/dashboard --view

# Esperado:
# Performance: 50-60 (fue 20-30)
# LCP: < 2.5s (fue 5-8s)
# FID: < 100ms
```

#### Test 4: Verificar queries en red
```
F12 > Network > Filter: XHR/Fetch
- Navegar entre páginas
- Verificar que NO haya requests duplicadas
- El mismo endpoint debe cachearse
```

---

## 📅 SEMANA 2: FASE ALTA PRIORIDAD

### Día 6️⃣-7️⃣: Virtualización de Plan de Cuentas

#### Paso 6.1: Instalar dependencias
```bash
npm install react-window react-window-infinite-loader
npm install -D @types/react-window
npm install -D @types/react-window-infinite-loader
```

#### Paso 6.2: Crear componente virtualizado
```bash
# El archivo ya está creado en:
# src/components/plan-cuentas/VirtualizedAccountTree.tsx

# Copiar a su ubicación final
copy src\components\plan-cuentas\VirtualizedAccountTree.tsx ^
     src\components\plan-cuentas\VirtualizedAccountTree.tsx
```

#### Paso 6.3: Reemplazar TreeItem en page.tsx
```typescript
// src/app/plan-cuentas/page.tsx
// Cambiar de:
{nodesList.map((node) => <TreeItem key={node.id} node={node} />)}

// A:
<div style={{ height: '600px' }}>
    <VirtualizedAccountTree
        items={nodesList}
        height={600}
        itemSize={32}
        onExpand={handleExpand}
        onLoadChildren={loadChildren}
        onNodeClick={handleNodeClick}
    />
</div>
```

#### Paso 6.4: Pruebas
```bash
npm run dev

# Navegar a Plan de Cuentas
# Abrir DevTools > Performance
# Scroll rápidamente
# Esperado: 55-60 FPS (fue 15-20 FPS)
```

---

### Día 8️⃣: Memoización de Componentes

#### Paso 8.1: Memoizar componentes dashboard
```typescript
// src/app/dashboard/page.tsx

// ✅ Agregar React.memo
const MetricCard = React.memo(({ metric }) => (
    // contenido
))

// ✅ Usar useMemo
const metricCards = useMemo(() => [
    // cálculos
], [metrics])
```

#### Paso 8.2: Usar useCallback
```typescript
// src/app/plan-cuentas/page.tsx

const handleExpand = useCallback(async (nodeId: string) => {
    // lógica
}, [])

const handleNodeClick = useCallback((node) => {
    // lógica
}, [])
```

#### Paso 8.3: Verificar rendering
```bash
# React DevTools Profiler
npm install -D react-devtools-profiler

# O usar built-in DevTools:
# F12 > React DevTools > Profiler
# Record rendering
# Verificar que componentes no se re-renderizan sin cambios
```

---

### Día 9️⃣: Lazy Loading de Rutas

#### Paso 9.1: Actualizar next.config.ts
```typescript
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    output: "standalone",
    experimental: {
        optimizePackageImports: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            'lucide-react',
        ],
    },
    // ... resto de configuración
}

export default nextConfig
```

#### Paso 9.2: Implementar dynamic imports
```typescript
// src/app/layout.tsx
import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('./dashboard/page'), {
    loading: () => <LoadingSpinner />,
})

const Facturas = dynamic(() => import('./facturas/page'), {
    loading: () => <LoadingSpinner />,
})

// ... usar en rutas
```

#### Paso 9.3: Verificar bundle size
```bash
# Instalar analizador de bundle
npm install --save-dev @next/bundle-analyzer

# Crear nuevo next.config
# npm run build && npm run analyze

# Esperado: Initial bundle < 200KB (fue 500KB)
```

---

### Día 🔟: Testing Semana 2

#### Test Performance
```bash
lighthouse http://localhost:3000/plan-cuentas --view

# Esperado:
# Performance: 70-80 (fue 40-50)
# LCP: < 1.5s
# CLS: < 0.1
```

#### Test Memory
```
F12 > Memory > Take Heap Snapshot
- Plan de Cuentas con 5,000 items: <10MB (fue 50MB)
```

---

## 📅 SEMANA 3: FASE MEDIA PRIORIDAD

### Día 11️⃣-12️⃣: Persistencia de React Query

#### Paso 11.1: Instalar dependencia
```bash
npm install @tanstack/react-query-persist-client
```

#### Paso 11.2: Reemplazar QueryProvider
```bash
copy src\providers\QueryProvider.optimized.tsx src\providers\QueryProvider.tsx
```

#### Paso 11.3: Actualizar hook useIsOnline
```bash
# Ya está creado en src/hooks/useIsOnline.ts
# Solo verificar que esté importado correctamente
```

#### Paso 11.4: Pruebas offline
```bash
# F12 > Network > Offline
# Navegar a página que ya visitamos
# Debería cargar desde localStorage
# Message: "Sin conexión - usando caché"
```

---

### Día 13️⃣: Paginación en Listas

#### Paso 13.1: Actualizar componentes de listas
```typescript
// src/app/facturas/page.tsx
const [page, setPage] = useState(1)
const { data } = useInvoices({ page, limit: 25 })

// Renderizar solo 25 items
return (
    <>
        <table>
            {data?.invoices.map(invoice => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
        </table>
        <Pagination
            current={page}
            total={Math.ceil(data?.total / 25)}
            onChange={setPage}
        />
    </>
)
```

#### Paso 13.2: Verificar en base de datos
```typescript
// src/app/api/invoices/route.ts
// Ya debe incluir paginación:

const [invoices, total] = await Promise.all([
    db.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
    }),
    db.invoice.count({ where })
])

return NextResponse.json({
    invoices,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
})
```

---

### Día 14️⃣: Testing Semana 3

#### Verificar offline mode
```
F12 > Network > Offline > Navegar
Esperado: Todo funciona desde caché
```

#### Verificar paginación
```
Navegar a Facturas > Ver primeros 25 items
Cambiar página > Ver siguientes 25 items
Esperado: Carga rápida (< 200ms)
```

---

## 📅 SEMANA 4: OPTIMIZACIONES AVANZADAS

### Día 15️⃣-16️⃣: Code Splitting y Analytics

#### Paso 15.1: Analytics
```bash
npm install @vercel/analytics
```

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout() {
    return (
        <html>
            <body>
                {/* contenido */}
                <Analytics />
            </body>
        </html>
    )
}
```

#### Paso 15.2: Monitoreo de Core Web Vitals
```typescript
// src/app/layout.tsx
import { useReportWebVitals } from 'next/web-vitals'

export function RootLayout() {
    useReportWebVitals((metric) => {
        console.log('Web Vital:', metric.name, metric.value)
        
        // Enviar a analytics
        if (metric.name === 'LCP') {
            console.log('LCP:', metric.value, 'ms')
        }
    })
    
    return (
        <html>
            {/* ... */}
        </html>
    )
}
```

---

### Día 17️⃣-18️⃣: Fine-tuning

#### Paso 17.1: Auditoría final
```bash
# Generar reporte completo
lighthouse http://localhost:3000 --view

# Esperado:
# Performance: 85-95
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

#### Paso 17.2: Comparar before/after
```bash
# Crear documento con métricas
# Lighthouse before: Performance 45
# Lighthouse after: Performance 90
# Mejora: +100%
```

---

### Día 19️⃣-20️⃣: Documentación y Deployment

#### Paso 19.1: Crear README de optimizaciones
```bash
# Crear archivo de documentación
touch OPTIMIZATION_SUMMARY.md
```

#### Paso 19.2: Commit y push
```bash
git add -A
git commit -m "feat: performance optimizations (Phase 1-4)

- Agregados índices de BD críticos
- Optimizado endpoint de dashboard metrics
- Mejorado caché de React Query
- Implementado SSR para dashboard
- Virtualización de árboles grandes
- Memoización de componentes
- Lazy loading de rutas
- Persistencia offline-first

Performance improvements:
- Dashboard: 5-8s → 0.5-1s (87% faster)
- Tree rendering: 3-4s → 0.1-0.2s (97% faster)
- Lighthouse: 45 → 90 (+100% improvement)
"

git push origin feature/performance-optimization
```

---

## 🧪 TESTING FINAL

### Checklist de Validación

```
SEMANA 1:
[ ] Índices de BD creados
[ ] Dashboard metrics endpoint optimizado
[ ] React Query staleTime actualizado
[ ] SSR implementado en dashboard
[ ] Dashboard carga < 1 segundo
[ ] Lighthouse: Performance > 60

SEMANA 2:
[ ] Componente virtualizado creado
[ ] Plan de Cuentas: 5,000 items sin lag
[ ] Componentes memoizados
[ ] Lazy loading activo
[ ] Lighthouse: Performance > 75
[ ] Memory usage < 50MB

SEMANA 3:
[ ] Persistencia localStorage activa
[ ] Modo offline funciona
[ ] Paginación en listas implementada
[ ] Bundle size < 200KB
[ ] Lighthouse: Performance > 85

SEMANA 4:
[ ] Analytics integrado
[ ] Web Vitals monitoreados
[ ] Reporte final generado
[ ] Documentación completada
[ ] Lighthouse: Performance > 90
```

---

## 📊 MÉTRICAS FINALES ESPERADAS

```
MÉTRICA                      ANTES    DESPUÉS  MEJORA
Dashboard Load               5-8s     0.5-1s   87%
Tree Rendering (5k items)    3-4s     0.1-0.2s 97%
API Response Time            2-3s     0.2-0.4s 85%
First Contentful Paint       4-6s     1.5-2s   70%
Time to Interactive          7-10s    2-3s     75%
Bundle Size                  500KB    150KB    70%
Memory Usage                 80-120MB 20-40MB  75%
Lighthouse Score             45-55    85-95    +80%
```

---

## 🆘 Troubleshooting

### Problema: "Module not found" después de cambios
```bash
# Solución: Limpiar cache de Next.js
rm -rf .next
npm run dev
```

### Problema: "Cannot read property of undefined"
```typescript
// Agregar validación:
if (!data) return <LoadingSpinner />
```

### Problema: IndexedDB/localStorage no funciona
```typescript
// Agregar check:
if (typeof window === 'undefined') return null
```

### Problema: Queries lentas aún después de índices
```sql
-- Verificar índices:
SHOW INDEX FROM chart_of_accounts;

-- Reconstruir índices:
OPTIMIZE TABLE chart_of_accounts;
```

---

## ✅ Conclusión

Si completaste todos estos pasos:
- ✅ 87-90% mejora en rendimiento
- ✅ Lighthouse score > 90
- ✅ User experience significativamente mejorado
- ✅ Código más mantenible y escalable

**¡Excelente trabajo! 🎉**

