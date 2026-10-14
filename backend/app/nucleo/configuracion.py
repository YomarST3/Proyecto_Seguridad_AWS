import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Configuracion(BaseSettings):
    NOMBRE_PROYECTO: str = "SalesIA Enterprise"
    VERSION: str = "1.0.0"
    API_V1_PREFIJO: str = "/api/v1"

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Base de Datos PostgreSQL / Supabase
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://postgres:postgres@localhost:5433/salesia_db"
    )
    # Cadena directa para migraciones Alembic (puerto 5432 o sesión directa)
    DIRECT_DATABASE_URL: Optional[str] = os.getenv("DIRECT_DATABASE_URL", None)

    # Supabase Auth & Proyecto SalesIA Enterprise (mvlsuvxwthaakfeqzkhy)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://mvlsuvxwthaakfeqzkhy.supabase.co")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv(
        "SUPABASE_PUBLISHABLE_KEY", 
        os.getenv("SUPABASE_ANON_KEY", "sb_publishable_4LV8d2wOEio84iS0V9mnhg_XM-NZxQl")
    )
    SUPABASE_ANON_KEY: str = os.getenv(
        "SUPABASE_ANON_KEY", 
        "sb_publishable_4LV8d2wOEio84iS0V9mnhg_XM-NZxQl"
    )
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", None)
    SUPABASE_JWT_SECRET: str = os.getenv(
        "SUPABASE_JWT_SECRET", 
        "super-secret-supabase-jwt-key-for-local-dev-fallback-32chars"
    )
    SUPABASE_JWT_ALGORITHM: str = os.getenv("SUPABASE_JWT_ALGORITHM", "HS256")
    SUPABASE_JWT_JWKS_URL: str = os.getenv(
        "SUPABASE_JWT_JWKS_URL", 
        "https://mvlsuvxwthaakfeqzkhy.supabase.co/auth/v1/.well-known/jwks.json"
    )

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
    ORIGENES_PERMITIDOS_CORS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


configuracion = Configuracion()
