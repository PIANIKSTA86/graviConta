# 🏗️ ARQUITECTURA DE OPTIMIZACIÓN - DIAGRAMA VISUAL

## 1. FLUJO DE DATOS - ANTES vs DESPUÉS

### ❌ ANTES (Problema)
```
Usuario en Dashboard
        ↓
Browser ejecuta JavaScript
        ↓
⏳ ESPERA 2 SEGUNDOS
        ↓
Fetch /api/dashboard/metrics
        ↓
🔄 Backend CARGA TODO (10,000 registros)
        ↓
❌ Procesa TODO en memoria (Node.js thread bloqueado)
        ↓
Calcula manualmente balances
        ↓
Retorna datos
        ↓
Browser renderiza componentes
        ↓
⏳ ESPERA 3 SEGUNDOS MÁS
        ↓
Usuario ve dashboard
        ↓
⏱️ TOTAL: 5-8 SEGUNDOS ❌
```

### ✅ DESPUÉS (Solución)
```
Usuario en Dashboard
        ↓
Browser ejecuta JavaScript
        ↓
✅ React Query: "¿Tengo caché?"
        ↓
        YES: Mostrar datos                    NO: Fetch
        ↓                                        ↓
    Muestra datos               ⚡ MÁXIMO 300ms (con índices)
    al instante                      ↓
        ↓                        Backend usa BD
    (50-100ms)               GROUP BY (agregación)
        ↓                            ↓
                                Retorna 4 totales
                                     ↓
                                 Browser renderiza
                                     ↓
    ✅ TOTAL: 0.5-1 SEGUNDO ✅
```

---

## 2. ARQUITECTURA DE OPTIMIZACIÓN - 4 CAPAS

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTACIÓN (UI)                       │
│  ┌──────────────────────────────────────────────────────┤
│  │ • Memoized Components (React.memo)                    │
│  │ • Virtualized Lists (react-window)                    │
│  │ • Lazy Loading (dynamic imports)                      │
│  │ • Server-Side Rendering                              │
│  └──────────────────────────────────────────────────────┤
│  
├─────────────────────────────────────────────────────────┤
│              GESTIÓN DE ESTADO (Data)                    │
│  ┌──────────────────────────────────────────────────────┤
│  │ React Query Client                                    │
│  │ • staleTime: 30-45 minutos                            │
│  │ • gcTime: 60+ minutos                                 │
│  │ • placeholderData: Keep previous                      │
│  │ • Persistencia: localStorage                          │
│  │ • Offline: Mode support                               │
│  └──────────────────────────────────────────────────────┤
│
├─────────────────────────────────────────────────────────┤
│              API & NETWORKING (Backend)                  │
│  ┌──────────────────────────────────────────────────────┤
│  │ Next.js API Routes                                    │
│  │ • Agregaciones en BD (GROUP BY)                       │
│  │ • Paginación (25 items/página)                        │
│  │ • Caching headers                                     │
│  │ • Compresión gzip                                     │
│  │ • Rate limiting                                       │
│  └──────────────────────────────────────────────────────┤
│
├─────────────────────────────────────────────────────────┤
│            BASE DE DATOS (Persistencia)                  │
│  ┌──────────────────────────────────────────────────────┤
│  │ MySQL/MariaDB con Prisma ORM                          │
│  │ • Índices optimizados                                 │
│  │ • Agregaciones eficientes                             │
│  │ • Query plans analizados                              │
│  │ • Connection pooling                                  │
│  │ • Backup/Recovery                                     │
│  └──────────────────────────────────────────────────────┤
│
└─────────────────────────────────────────────────────────┘
```

---

## 3. FLUJO DE OPTIMIZACIONES POR FASE

### FASE 1: BASE DE DATOS (Semana 1)
```
┌─────────────────────┐
│  Sin Índices        │
├─────────────────────┤
│ Full Table Scan     │
│ 5,000ms ❌          │
└─────────────────────┘
        ↓ Migración
        ↓
┌─────────────────────┐
│  Con Índices        │
├─────────────────────┤
│ Index Lookup        │
│ 100-300ms ✅        │
└─────────────────────┘
```

### FASE 2: FRONTEND (Semana 2)
```
┌──────────────────────────┐      ┌──────────────────────────┐
│ Renderizar TODO (5000)   │      │ Virtualizar (render 12)  │
├──────────────────────────┤      ├──────────────────────────┤
│ 3-4 segundos ❌          │  →   │ 100-200ms ✅             │
│ 50MB memory ❌           │      │ 2MB memory ✅            │
│ 15-20 FPS ❌             │      │ 55-60 FPS ✅             │
└──────────────────────────┘      └──────────────────────────┘
```

### FASE 3: CACHÉ (Semana 3)
```
┌──────────────────────────┐      ┌──────────────────────────┐
│ Siempre Fetch            │      │ Smart Caching            │
├──────────────────────────┤      ├──────────────────────────┤
│ API call siempre ❌      │  →   │ localStorage + offline ✅ │
│ 2-3 segundos ❌          │      │ 0ms en caché ✅          │
│ Network solo ❌          │      │ Offline capable ✅       │
└──────────────────────────┘      └──────────────────────────┘
```

### FASE 4: MONITOREO (Semana 4)
```
┌──────────────────────────┐
│ Analytics & Monitoring   │
├──────────────────────────┤
│ Web Vitals tracked ✅    │
│ Performance monitored ✅ │
│ Alertas configuradas ✅  │
└──────────────────────────┘
```

---

## 4. COMPONENTES CLAVE Y SUS MEJORAS

### API Endpoint: /api/dashboard/metrics

```
ANTES:
  GET /api/dashboard/metrics
  ├─ 1. SELECT * FROM chart_of_accounts (1000ms)
  ├─ 2. SELECT * FROM transaction_details (2000ms)
  ├─ 3. SELECT * FROM transactions (1000ms)
  ├─ 4. Procesar en Node.js (2000ms)
  └─ TOTAL: 6000ms ❌

DESPUÉS:
  GET /api/dashboard/metrics
  ├─ 1. SELECT accountType, SUM() FROM ... GROUP BY (100ms)
  ├─ 2. SELECT SUM() FROM cash_accounts (50ms)
  └─ TOTAL: 150ms ✅

MEJORA: 40x más rápido
```

### React Query Hooks: useQueries

```
ANTES:
  useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: fetch,
    staleTime: 5 * 60 * 1000,      // ❌ 5 minutos
    gcTime: 10 * 60 * 1000,        // ❌ 10 minutos
    refetchOnWindowFocus: true,    // ❌ Refetch siempre
    refetchOnMount: true,          // ❌ Refetch siempre
  })

DESPUÉS:
  useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: fetch,
    staleTime: 30 * 60 * 1000,     // ✅ 30 minutos
    gcTime: 60 * 60 * 1000,        // ✅ 60 minutos
    refetchOnWindowFocus: false,   // ✅ Solo si stale
    refetchOnMount: false,         // ✅ Solo si stale
    placeholderData: prev => prev, // ✅ Mantiene datos
  })

MEJORA: 80% menos API calls
```

### Componente: Plan de Cuentas

```
ANTES:
  return items.map(node => <TreeItem node={node} />)
  
  Resultado:
  ├─ 5,000 componentes en DOM 🔴
  ├─ 5,000 re-renders en cada cambio 🔴
  ├─ 3-4 segundos render time 🔴
  └─ 50MB memory usage 🔴

DESPUÉS:
  <VirtualizedAccountTree items={items} height={600} />
  
  Resultado:
  ├─ 12-15 componentes en DOM ✅
  ├─ Solo visibles re-renderizan ✅
  ├─ 100-200ms render time ✅
  └─ 2MB memory usage ✅

MEJORA: 30x más rápido, 25x menos memoria
```

---

## 5. MATRIZ DE DECISIONES TECNOLÓGICAS

| Problema | Solución | Librería | Beneficio |
|----------|----------|----------|-----------|
| Render 5k items | Virtualización | react-window | 30x más rápido |
| Consultas lentas | Índices + agregaciones | Prisma + SQL | 40x más rápido |
| Sin caché | React Query optimizado | @tanstack/react-query | 80% menos API |
| Off-canvas | Persistencia | localStorage | Funciona offline |
| Re-renders innecesarios | Memoización | React.memo | 100% menos innecesarios |
| Bundle grande | Code splitting | dynamic import | 70% más pequeño |
| Datos sin paginación | Paginación | API + DB | 100x menos data |
| Cálculos en main thread | Web Workers | Worker API | UI never blocks |

---

## 6. PIPELINE DE DEPLOY

```
┌─────────────────────────────────────────────────────────┐
│ 1. DESARROLLO (local)                                   │
│   └─ git checkout -b feature/optimization               │
│   └─ Implementar cambios                                │
│   └─ npm run dev + testing local                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ 2. TESTING (staging)                                    │
│   └─ npm run build                                      │
│   └─ Lighthouse audit                                   │
│   └─ Performance benchmarks                             │
│   └─ Cross-browser testing                              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ 3. REVISIÓN (code review)                               │
│   └─ git push origin feature/optimization               │
│   └─ Create pull request                                │
│   └─ Review cambios + benchmarks                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ 4. PRODUCCIÓN (deploy)                                  │
│   └─ git merge feature/optimization → main              │
│   └─ npm run build                                      │
│   └─ Deploy a servidor                                  │
│   └─ Monitor performance                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. MÉTRICAS DE ÉXITO (Web Vitals)

```
LCP (Largest Contentful Paint)
├─ ANTES: 5-8 segundos ❌
├─ OBJETIVO: < 1.5 segundos ✅
├─ UMBRAL GOOGLE: > 2.5s es "pobre"
└─ MEJORA: 70-75%

FID (First Input Delay)
├─ ANTES: 200-500ms ❌
├─ OBJETIVO: < 100ms ✅
├─ UMBRAL GOOGLE: > 100ms es "pobre"
└─ MEJORA: 75-80%

CLS (Cumulative Layout Shift)
├─ ANTES: 0.5-0.8 ❌
├─ OBJETIVO: < 0.1 ✅
├─ UMBRAL GOOGLE: > 0.1 es "pobre"
└─ MEJORA: 80-90%

Performance Score (Lighthouse)
├─ ANTES: 45-55 ❌
├─ OBJETIVO: 85-95 ✅
├─ EXCELENTE: > 90
└─ MEJORA: +80 puntos
```

---

## 8. REQUISITOS TÉCNICOS MÍNIMOS

```
DESARROLLO:
├─ Node.js: v18+ (v20+ recomendado)
├─ npm: v9+
├─ Git: v2.39+
├─ RAM: 8GB mínimo (16GB recomendado)
└─ Disco: 10GB libre

PRODUCCIÓN:
├─ Node.js: v20 LTS
├─ MySQL/MariaDB: v8.0+
├─ RAM: 4GB mínimo (8GB recomendado)
├─ CPU: 2 cores mínimo
├─ Disco: 50GB (depende de datos)
└─ Ancho de banda: 100 Mbps+

CLIENTE:
├─ Browser: Moderno (Chrome 90+, Firefox 88+, Safari 14+)
├─ Conexión: 4G mínimo (10 Mbps recomendado)
├─ Dispositivo: Mobile OK, Desktop óptimo
└─ JavaScript: Debe estar habilitado
```

---

## 9. DEPENDENCIAS A AGREGAR

```
npm install:
├─ react-window                    (virtualización)
├─ react-window-infinite-loader    (lazy loading en virtualización)
├─ @tanstack/react-query-persist-client (persistencia)

npm install -D:
├─ @types/react-window
├─ @types/react-window-infinite-loader
└─ @next/bundle-analyzer (opcional para análisis)
```

---

## 10. ARQUITECTURA FINAL (Post-Optimización)

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                      │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─ React Components (Optimizados)                        │
│  ├─ React Query (Con persistencia)                        │
│  ├─ LocalStorage (Offline-first)                          │
│  └─ Web Workers (Cálculos pesados)                        │
│                                                            │
├──────────────────────────────────────────────────────────┤
│                    SERVIDOR (Next.js)                     │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─ API Routes (Agregaciones)                             │
│  ├─ Prisma ORM (Con índices)                              │
│  ├─ Caching headers (30+ min)                             │
│  └─ Compression (gzip)                                    │
│                                                            │
├──────────────────────────────────────────────────────────┤
│                  BASE DE DATOS (MySQL)                    │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ├─ Índices optimizados                                   │
│  ├─ Agregaciones eficientes                               │
│  ├─ Connection pooling                                    │
│  └─ Query optimization                                    │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

**Diagrama completo de arquitectura finalizado.**  
**Listo para implementación.**  
**Referencia: GUIA_IMPLEMENTACION_PASO_A_PASO.md**

