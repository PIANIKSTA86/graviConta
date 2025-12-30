# 📚 REFERENCIA RÁPIDA DE COMANDOS

## 🚀 Optimización Rápida (Automática)

### Windows
```bash
OPTIMIZE.bat
```

### macOS/Linux
```bash
bash OPTIMIZE.sh
```

---

## 📊 Medir Performance

### Antes de empezar (Baseline)
```bash
# 1. Iniciar servidor
npm run dev

# 2. Lighthouse (en otra terminal)
npm install -g lighthouse
lighthouse http://localhost:3000 --view

# 3. Anotar resultados
# Performance Score: ___
# LCP: ___ ms
# FID: ___ ms
# CLS: ___
```

### Después de optimizaciones
```bash
lighthouse http://localhost:3000 --view

# Comparar resultados esperados:
# Performance Score: 90+ (fue 45-55)
# LCP: < 1.5s (fue 5-8s)
# FID: < 100ms
# CLS: < 0.1
```

---

## 🔧 Mantenimiento de BD

### Ver índices creados
```bash
# MySQL
mysql -u root -p
SHOW INDEX FROM chart_of_accounts;
SHOW INDEX FROM transactions;
SHOW INDEX FROM invoices;
```

### Optimizar tablas
```bash
# En caso de degradación de performance
mysql -u root -p
OPTIMIZE TABLE chart_of_accounts;
OPTIMIZE TABLE transactions;
OPTIMIZE TABLE invoices;
```

### Analizar query performance
```sql
-- Activar query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Luego revisar:
SHOW PROCESSLIST;
SELECT * FROM mysql.slow_log;
```

---

## 🧪 Verificar Caché

### React Query DevTools
```typescript
// Agregar a QueryProvider.tsx (desarrollo)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function ReactQueryProvider({ children }) {
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

### localStorage
```javascript
// En consola del navegador
JSON.parse(localStorage.getItem('persist:root'))

// Verificar queries cacheadas
Object.keys(localStorage).filter(key => key.includes('REACT_QUERY'))
```

### Network DevTools
```
F12 > Network > Filter: XHR/Fetch
- No debería haber requests duplicadas
- Las mismas queries deberían cachearse
- Tiempo de respuesta: 0ms (desde caché) o 100-300ms (desde BD)
```

---

## 🐛 Troubleshooting

### Problema: Cambios no se ven
```bash
# Solución: Limpiar cache de Next.js
rm -rf .next
npm run dev
```

### Problema: "Module not found"
```bash
# Solución: Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Problema: Queries lentas
```sql
-- Verificar si índices existen
SHOW INDEX FROM chart_of_accounts WHERE Column_name = 'companyId';

-- Si no existen, crear:
CREATE INDEX idx_chart_of_accounts_company_active 
  ON chart_of_accounts(companyId, isActive);

-- Reconstruir índices
OPTIMIZE TABLE chart_of_accounts;
```

### Problema: Memory leak en browser
```javascript
// En console:
// 1. Abrir React DevTools
// 2. Profiler > Record
// 3. Hacer acciones
// 4. Stop recording
// 5. Buscar componentes que no desmontacen
```

---

## 📈 Monitoreo Continuo

### Agregar Web Vitals
```typescript
// src/app/layout.tsx
import { useReportWebVitals } from 'next/web-vitals'

export function RootLayout() {
    useReportWebVitals((metric) => {
        console.log(metric)
        
        // Enviar a analytics
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', metric.name, {
                event_category: 'Web Vitals',
                value: Math.round(metric.value),
                metric_id: metric.id,
            })
        }
    })
    
    return <html>{/* ... */}</html>
}
```

### Lighthouse CI
```bash
# Instalar
npm install -g @lhci/cli@latest

# Configurar lighthouse.config.json
cat > lighthouserc.json << 'EOF'
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "uploadArtifacts": true
    },
    "assert": {
      "preset": "lighthouse:recommended"
    }
  }
}
EOF

# Ejecutar
lhci autorun
```

---

## 📝 Cheklist de Verificación

### Fase 1 (Semana 1)
```
[ ] Índices de BD creados y activos
[ ] Dashboard metrics endpoint usa agregaciones
[ ] React Query staleTime: 30+ minutos
[ ] SSR en dashboard implementado
[ ] Performance < 1 segundo para dashboard
[ ] Lighthouse Performance > 60
```

### Fase 2 (Semana 2)
```
[ ] Virtualización de árbol implementada
[ ] Plan de cuentas: 5,000 items sin lag
[ ] Componentes con React.memo
[ ] useCallback en event handlers
[ ] Lazy loading de rutas activo
[ ] Lighthouse Performance > 75
```

### Fase 3 (Semana 3)
```
[ ] localStorage persistence funciona
[ ] Modo offline funciona sin errores
[ ] Paginación: 25 items por página
[ ] Bundle size < 200KB (initial)
[ ] Memory usage < 50MB típico
[ ] Lighthouse Performance > 85
```

### Fase 4 (Semana 4)
```
[ ] Analytics integrado
[ ] Web Vitals en reportes
[ ] Documentación actualizada
[ ] Tests de performance completados
[ ] Lighthouse Performance > 90
[ ] Código en producción
```

---

## 🔗 Enlaces Útiles

### Documentación Oficial
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Query](https://tanstack.com/query/latest)
- [Prisma Performance](https://www.prisma.io/docs/orm/prisma-client/queries/performance-optimization)
- [Web Vitals](https://web.dev/vitals)

### Herramientas
- [Google Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Bundle Analyzer](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer)
- [React DevTools Profiler](https://react-devtools-profiler.vercel.app/)

### Artículos Recomendados
- [Next.js Performance Best Practices](https://nextjs.org/learn)
- [React Query Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [Prisma Advanced Queries](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing)

---

## 📞 Soporte

### Si tienes problemas:
1. Revisar [GUIA_IMPLEMENTACION_PASO_A_PASO.md](./GUIA_IMPLEMENTACION_PASO_A_PASO.md)
2. Buscar en sección "Troubleshooting"
3. Revisar logs del servidor: `npm run dev`
4. Limpiar cache: `rm -rf .next node_modules`
5. Reinstalar: `npm install && npm run db:generate`

---

**Última actualización:** 30/12/2025  
**Versión:** 1.0  
**Estado:** ✅ Listo para producción

