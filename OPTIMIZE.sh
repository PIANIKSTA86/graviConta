#!/bin/bash
# 🚀 SCRIPT DE OPTIMIZACIÓN RÁPIDA
# Ejecutar: bash OPTIMIZE.sh

echo "=================================="
echo "GraviConta - Performance Optimization"
echo "=================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# FASE 1: Base de Datos
echo -e "${BLUE}FASE 1: Optimizando Base de Datos${NC}"
echo "Ejecutando: npm run db:migrate"
npm run db:migrate

echo -e "${GREEN}✅ Índices creados${NC}"
echo ""

# FASE 2: Backend
echo -e "${BLUE}FASE 2: Optimizando Backend${NC}"

# Backup
cp src/app/api/dashboard/metrics/route.ts src/app/api/dashboard/metrics/route.backup.ts
cp src/hooks/useQueries.ts src/hooks/useQueries.backup.ts

# Copy optimized versions
cp src/app/api/dashboard/metrics/route.optimized.ts src/app/api/dashboard/metrics/route.ts
cp src/hooks/useQueries.optimized.ts src/hooks/useQueries.ts

echo -e "${GREEN}✅ Archivos reemplazados${NC}"
echo ""

# FASE 3: Dependencies
echo -e "${BLUE}FASE 3: Instalando dependencias de optimización${NC}"
npm install react-window react-window-infinite-loader @tanstack/react-query-persist-client
npm install -D @types/react-window

echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# FASE 4: Testing
echo -e "${BLUE}FASE 4: Testing${NC}"
echo "Ejecutando: npm run build"
npm run build

echo -e "${GREEN}✅ Build completado${NC}"
echo ""

# FASE 5: Lighthouse
echo -e "${BLUE}FASE 5: Generando reporte de Lighthouse${NC}"
echo "Instala: npm install -g lighthouse"
echo "Usa: lighthouse http://localhost:3000 --view"
echo ""

# Resumen
echo -e "${GREEN}=================================="
echo "✅ OPTIMIZACIÓN COMPLETADA"
echo "===================================${NC}"
echo ""
echo "Próximos pasos:"
echo "1. npm run dev"
echo "2. Verifica performance en DevTools"
echo "3. Compara antes/después"
echo ""
echo "Documentos de referencia:"
echo "- REPORTE_RENDIMIENTO_Y_OPTIMIZACION.md"
echo "- GUIA_IMPLEMENTACION_PASO_A_PASO.md"
echo ""
