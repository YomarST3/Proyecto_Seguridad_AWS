from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from app.nucleo.base_datos import BaseDeclarativa


class Empresa(BaseDeclarativa):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    identificador_fiscal = Column(String(50), nullable=False, unique=True, index=True) # RUC / NIF / CIF
    direccion = Column(String(300), nullable=True)
    telefono = Column(String(50), nullable=True)
    correo_electronico = Column(String(100), nullable=True)
    moneda = Column(String(10), default="USD", nullable=False)
    tasa_impuesto = Column(Numeric(5, 4), default=Decimal("0.1800"), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("tasa_impuesto >= 0 AND tasa_impuesto <= 1", name="chk_empresas_tasa_impuesto"),
    )

    usuarios = relationship("Usuario", back_populates="empresa", cascade="all, delete-orphan")
    roles = relationship("Rol", back_populates="empresa", cascade="all, delete-orphan")
