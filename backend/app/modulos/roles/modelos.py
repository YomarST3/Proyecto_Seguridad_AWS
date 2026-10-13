from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, 
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.nucleo.base_datos import BaseDeclarativa


class Rol(BaseDeclarativa):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="RESTRICT"), nullable=False, index=True)
    codigo = Column(String(50), nullable=False) # ADMINISTRADOR, GERENTE, VENDEDOR, ANALISTA, ALMACEN
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    es_sistema = Column(Boolean, default=False, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("empresa_id", "codigo", name="uq_roles_empresa_codigo"),
    )

    empresa = relationship("Empresa", back_populates="roles")
    usuarios_asociados = relationship("UsuarioRol", back_populates="rol", cascade="all, delete-orphan")
    permisos_asociados = relationship("RolPermiso", back_populates="rol", cascade="all, delete-orphan")


class Permiso(BaseDeclarativa):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(100), nullable=False, unique=True, index=True) # e.g. 'clientes:leer', 'ventas:crear'
    modulo = Column(String(50), nullable=False, index=True)              # e.g. 'clientes', 'ventas'
    nombre = Column(String(150), nullable=False)
    descripcion = Column(String(255), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    roles_asociados = relationship("RolPermiso", back_populates="permiso", cascade="all, delete-orphan")


class RolPermiso(BaseDeclarativa):
    __tablename__ = "roles_permisos"

    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permiso_id = Column(Integer, ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True)
    asignado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    rol = relationship("Rol", back_populates="permisos_asociados")
    permiso = relationship("Permiso", back_populates="roles_asociados")


class UsuarioRol(BaseDeclarativa):
    __tablename__ = "usuarios_roles"

    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), primary_key=True)
    asignado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    asignado_por_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)

    usuario = relationship("Usuario", back_populates="roles_asignados", foreign_keys=[usuario_id])
    rol = relationship("Rol", back_populates="usuarios_asociados")
