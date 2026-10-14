@echo off
title [SalesIA Enterprise - Backend API (Puerto 8000)]
color 0B

echo ================================================================
echo    SALESIA ENTERPRISE - SERVICIO BACKEND (FASTAPI)
echo ================================================================
echo.

cd /d "%~dp0backend"

:: Verificar entorno virtual
echo [1/2] Verificando entorno virtual de Python...
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creando entorno virtual...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [INFO] Instalando dependencias de backend...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

:: Iniciar servidor FastAPI
echo [2/2] Iniciando Uvicorn en http://127.0.0.1:8000 ...
echo [DOCS] Swagger interactivo disponible en: http://127.0.0.1:8000/api/v1/docs
echo.
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
