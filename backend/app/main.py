from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import settings
from app.api.v1 import auth, database, statistics

app = FastAPI(
    title=f"{settings.PROJECT_NAME} (Lightweight API)",
    version=settings.VERSION,
    description="API ligera y modular para soporte de base de datos (Supabase Cloud), validación y cálculos analíticos.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS: orígenes autorizados (localhost + Cloudflare Pages)
cors_origins = list(settings.BACKEND_CORS_ORIGINS)
frontend_url = os.getenv("FRONTEND_URL", "https://salesia-enterprise.pages.dev")

for url in [
    frontend_url,
    frontend_url.rstrip("/"),
    f"{frontend_url.rstrip('/')}/",
    "https://salesia-enterprise.pages.dev",
    "https://salesia-enterprise.pages.dev/",
    "http://127.0.0.1:5173",
    "http://localhost:5173"
]:
    if url and url not in cors_origins:
        cors_origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Inclusión de routers esenciales (Base de Datos, Auth y Estadística)
app.include_router(database.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(statistics.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "mode": "Lightweight Database & Analytics Backend",
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "documentation": f"{settings.API_V1_STR}/docs"
    }


@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    from app.core.database import SessionLocal
    try:
        db = SessionLocal()
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected", "mode": "lightweight"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


