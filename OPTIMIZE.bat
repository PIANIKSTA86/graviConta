@echo off
REM 🚀 SCRIPT DE OPTIMIZACIÓN RÁPIDA (Windows)
REM Ejecutar: OPTIMIZE.bat

setlocal enabledelayedexpansion

echo ==================================
echo GraviConta - Performance Optimization
echo ==================================
echo.

REM FASE 1: Base de Datos
echo.
echo [*] FASE 1: Optimizando Base de Datos...
npm run db:migrate

if %errorlevel% neq 0 (
    echo [ERROR] Migración de BD falló
    exit /b 1
)
echo [OK] Índices creados
echo.

REM FASE 2: Backend
echo [*] FASE 2: Optimizando Backend...

REM Backup
if exist "src\app\api\dashboard\metrics\route.ts" (
    copy "src\app\api\dashboard\metrics\route.ts" "src\app\api\dashboard\metrics\route.backup.ts"
)
if exist "src\hooks\useQueries.ts" (
    copy "src\hooks\useQueries.ts" "src\hooks\useQueries.backup.ts"
)

REM Copy optimized versions
copy "src\app\api\dashboard\metrics\route.optimized.ts" "src\app\api\dashboard\metrics\route.ts"
copy "src\hooks\useQueries.optimized.ts" "src\hooks\useQueries.ts"

echo [OK] Archivos reemplazados
echo.

REM FASE 3: Dependencies
echo [*] FASE 3: Instalando dependencias...
npm install react-window react-window-infinite-loader @tanstack/react-query-persist-client
npm install -D @types/react-window

if %errorlevel% neq 0 (
    echo [ERROR] Instalación de dependencias falló
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

REM FASE 4: Testing
echo [*] FASE 4: Building...
npm run build

if %errorlevel% neq 0 (
    echo [ERROR] Build falló
    exit /b 1
)
echo [OK] Build completado
echo.

REM FASE 5: Summary
echo ==================================
echo [SUCCESS] OPTIMIZACIÓN COMPLETADA
echo ==================================
echo.
echo Próximos pasos:
echo 1. npm run dev
echo 2. Verifica performance en DevTools
echo 3. Compara antes/después
echo.
echo Documentos de referencia:
echo - REPORTE_RENDIMIENTO_Y_OPTIMIZACION.md
echo - GUIA_IMPLEMENTACION_PASO_A_PASO.md
echo.

pause
