"""
Módulo de Gestión y Diagnóstico de Base de Datos
Proporciona endpoints ligeros para verificar el estado, tablas, latencia y
operaciones esenciales con la base de datos (Supabase Cloud / PostgreSQL).
"""

import time
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter(prefix="/database", tags=["Base de Datos & Diagnóstico"])


@router.get("/status")
def get_database_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Retorna el estado de conexión con Supabase / PostgreSQL,
    midiendo la latencia real y la versión del motor.
    """
    start_time = time.time()
    try:
        result = db.execute(text("SELECT version(), current_database(), current_user, NOW() as server_time;")).fetchone()
        latency_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "status": "connected",
            "provider": "Supabase Cloud (PostgreSQL)",
            "latency_ms": latency_ms,
            "database_name": result[1] if result else "unknown",
            "db_user": result[2] if result else "unknown",
            "server_time": str(result[3]) if result else None,
            "pg_version": str(result[0]).split(",")[0] if result else "PostgreSQL"
        }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "disconnected",
            "provider": "Supabase Cloud (PostgreSQL)",
            "latency_ms": latency_ms,
            "error": str(e)
        }


@router.get("/ping")
def ping_database(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Ping ultraligero a la base de datos."""
    start_time = time.time()
    try:
        db.execute(text("SELECT 1;"))
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {"ping": "pong", "latency_ms": latency_ms, "healthy": True}
    except Exception as e:
        return {"ping": "failed", "healthy": False, "error": str(e)}


@router.get("/tables")
def list_database_tables(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Lista las tablas públicas de la base de datos y su estado.
    Permite validar qué tablas existen en Supabase.
    """
    try:
        query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        rows = db.execute(query).fetchall()
        table_names = [row[0] for row in rows]

        # Obtener recuentos estimados si hay tablas
        counts: Dict[str, int] = {}
        for tbl in table_names[:15]:  # Muestreo seguro de las primeras tablas
            try:
                cnt_row = db.execute(text(f'SELECT count(*) FROM "{tbl}";')).fetchone()
                counts[tbl] = cnt_row[0] if cnt_row else 0
            except Exception:
                counts[tbl] = -1

        return {
            "total_tables": len(table_names),
            "tables": table_names,
            "sample_counts": counts,
            "source": "PostgreSQL public schema"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consultando tablas de la base de datos: {str(e)}"
        )
