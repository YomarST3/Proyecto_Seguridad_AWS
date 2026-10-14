import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, synonym
from app.nucleo.base_datos import BaseDeclarativa


class Empresa(BaseDeclarativa):
    __tablename__ = "empresas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    razon_social = Column(String(180), nullable=False)
    nombre_comercial = Column(String(180), nullable=True)
    ruc = Column(String(20), nullable=True, unique=True, index=True)
    correo = Column(String(255), nullable=True)
    telefono = Column(String(30), nullable=True)
    direccion = Column(Text, nullable=True)
    moneda = Column(String(3), default="USD", nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    usuarios = relationship("Usuario", back_populates="empresa", cascade="all, delete-orphan")
    roles = relationship("Rol", back_populates="empresa", cascade="all, delete-orphan")
    clientes = relationship("Cliente", back_populates="empresa", cascade="all, delete-orphan")
    categorias = relationship("Categoria", back_populates="empresa", cascade="all, delete-orphan")
    productos = relationship("Producto", back_populates="empresa", cascade="all, delete-orphan")
    empleados = relationship("Empleado", back_populates="empresa", cascade="all, delete-orphan")
    pedidos = relationship("Pedido", back_populates="empresa", cascade="all, delete-orphan")
    ventas = relationship("Venta", back_populates="empresa", cascade="all, delete-orphan")

    nombre = synonym('razon_social')
    identificador_fiscal = synonym('ruc')
    correo_electronico = synonym('correo')

    # Sinónimos en inglés
    name = synonym('razon_social')
    tax_id = synonym('ruc')
    email = synonym('correo')
    phone = synonym('telefono')
    address = synonym('direccion')
    currency = synonym('moneda')
    is_active = synonym('activo')
    created_at = synonym('creado_en')
    updated_at = synonym('actualizado_en')

    @property
    def tax_rate(self):
        from decimal import Decimal
        return Decimal("0.1800")
