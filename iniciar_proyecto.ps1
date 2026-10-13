<#
.SYNOPSIS
    Lanzador inteligente y ordenado para SalesIA Enterprise.
.DESCRIPTION
    Verifica dependencias, inicia PostgreSQL en puerto 5433, inicia FastAPI (8000),
    inicia Vite SPA (5173) y comprueba el estado de salud.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SalesIA Enterprise - Launcher PowerShell"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "   🛡️  SALESIA ENTERPRISE - ENTORNO DE DESARROLLO LOCAL (POWERSHELL)" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot

# 1. Verificar PostgreSQL
Write-Host "[1/4] Verificando PostgreSQL (Puerto 5433)..." -ForegroundColor Yellow
$pgConn = Get-NetTCPConnection -LocalPort 5433 -State Listen -ErrorAction SilentlyContinue
if (-not $pgConn) {
    Write-Host "      Iniciando PostgreSQL en segundo plano..." -ForegroundColor DarkYellow
    $pgExe = "C:\Program Files\PostgreSQL\18\bin\postgres.exe"
    $pgData = Join-Path $env:USERPROFILE "pg_salesia_data"
    if (Test-Path $pgExe) {
        Start-Process -FilePath $pgExe -ArgumentList "-D `"$pgData`" -p 5433" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    } else {
        Write-Warning "No se encontró postgres.exe en C:\Program Files\PostgreSQL\18\bin."
    }
} else {
    Write-Host "      [OK] PostgreSQL ya activo en puerto 5433." -ForegroundColor Green
}

# 2. Iniciar Backend FastAPI
Write-Host "[2/4] Iniciando Backend FastAPI (Puerto 8000)..." -ForegroundColor Yellow
$backendBat = Join-Path $rootPath "iniciar_backend.bat"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"$backendBat`"" -WindowStyle Normal
Start-Sleep -Seconds 3

# 3. Iniciar Frontend Vite
Write-Host "[3/4] Iniciando Frontend React + Vite (Puerto 5173)..." -ForegroundColor Yellow
$frontendBat = Join-Path $rootPath "iniciar_frontend.bat"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"$frontendBat`"" -WindowStyle Normal
Start-Sleep -Seconds 3

# 4. Comprobar salud y abrir navegador
Write-Host "[4/4] Comprobando disponibilidad de servicios..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "      Backend API: OPERACIONAL ($($health.status), DB: $($health.database))" -ForegroundColor Green
} catch {
    Write-Host "      Backend API: Inicializando en segundo plano..." -ForegroundColor DarkYellow
}

Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "   ✅ SERVICIOS EN EJECUCIÓN:" -ForegroundColor Green
Write-Host "      - Frontend Web : http://127.0.0.1:5173" -ForegroundColor White
Write-Host "      - Swagger Docs : http://127.0.0.1:8000/api/v1/docs" -ForegroundColor White
Write-Host "      - Healthcheck  : http://127.0.0.1:8000/api/v1/health" -ForegroundColor White
Write-Host ""
Write-Host "   Para detener todos los servicios ejecute: .\detener_servicios.bat" -ForegroundColor Gray
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
