from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.nucleo.configuracion import configuracion

from sqlalchemy.pool import NullPool, QueuePool

db_url = configuracion.DATABASE_URL
# Supavisor en modo transacción (puerto 6543) requiere NullPool y desactivar prepared statements
es_pooler_transaccional = ":6543" in db_url

if es_pooler_transaccional:
    motor_db = create_engine(
        db_url,
        poolclass=NullPool,
        connect_args={"prepare_threshold": None},
        echo=False
    )
else:
    motor_db = create_engine(
        db_url,
        poolclass=QueuePool,
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
