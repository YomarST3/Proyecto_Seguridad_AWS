# SalesIA Enterprise - Lanzador PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SalesIA Enterprise - Launcher"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "   SALESIA ENTERPRISE - ENTORNO DE DESARROLLO LOCAL" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot

# 1. Base de datos
Write-Host "[1/3] Base de Datos configurada con Supabase Cloud..." -ForegroundColor Green

# 2. Iniciar Backend FastAPI
Write-Host "[2/3] Iniciando Backend FastAPI (Puerto 8000)..." -ForegroundColor Yellow
$backendBat = Join-Path $rootPath "iniciar_backend.bat"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"$backendBat`"" -WindowStyle Normal
Start-Sleep -Seconds 3

# 3. Iniciar Frontend Vite
Write-Host "[3/3] Iniciando Frontend React + Vite (Puerto 5173)..." -ForegroundColor Yellow
$frontendBat = Join-Path $rootPath "iniciar_frontend.bat"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"$frontendBat`"" -WindowStyle Normal
Start-Sleep -Seconds 3

# 4. Comprobar salud y abrir navegador
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "      Backend API: OPERACIONAL (Estado: $($health.status))" -ForegroundColor Green
} catch {
    Write-Host "      Backend API: Inicializando en ventana dedicada..." -ForegroundColor DarkYellow
}

Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "   SERVICIOS EN EJECUCION:" -ForegroundColor Green
Write-Host "      - Frontend Web : http://127.0.0.1:5173" -ForegroundColor White
Write-Host "      - Swagger Docs : http://127.0.0.1:8000/api/v1/docs" -ForegroundColor White
Write-Host "      - Healthcheck  : http://127.0.0.1:8000/api/v1/health" -ForegroundColor White
Write-Host ""
Write-Host "   Para detener todos los servicios ejecute: .\detener_servicios.bat" -ForegroundColor Gray
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
