from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.nucleo.configuracion import configuracion

# Motor de base de datos síncrono con pool optimizado para PostgreSQL / Supabase
motor_db = create_engine(
    configuracion.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=15,
    max_overflow=25,
    echo=False
)

SesionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=motor_db
)

BaseDeclarativa = declarative_base()


def obtener_sesion_db() -> Generator[Session, None, None]:
    """Inyector de dependencia para sesión transaccional de base de datos."""
    db = SesionLocal()
    try:
        yield db
    finally:
        db.close()
