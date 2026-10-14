import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, 
    Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, synonym
from app.nucleo.base_datos import BaseDeclarativa


class Rol(BaseDeclarativa):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="RESTRICT"), nullable=False, index=True)
    nombre = Column(String(80), nullable=False)
    codigo = Column(String(50), nullable=False)  # ADMINISTRADOR, GERENTE, VENDEDOR, ANALISTA, ALMACEN
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa", back_populates="roles")
    usuarios_asociados = relationship("UsuarioRol", back_populates="rol", cascade="all, delete-orphan")
    permisos_asociados = relationship("RolPermiso", back_populates="rol", cascade="all, delete-orphan")

    name = synonym('codigo')
    description = synonym('descripcion')
    is_active = synonym('activo')


class Permiso(BaseDeclarativa):
    __tablename__ = "permisos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    codigo = Column(String(100), nullable=False, unique=True, index=True)  # e.g. 'clientes:leer', 'ventas:crear'
    modulo = Column(String(60), nullable=False, index=True)                # e.g. 'clientes', 'ventas'
    accion = Column(String(60), nullable=False)
    descripcion = Column(Text, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    roles_asociados = relationship("RolPermiso", back_populates="permiso", cascade="all, delete-orphan")

    code = synonym('codigo')
    module = synonym('modulo')
    action = synonym('accion')
    description = synonym('descripcion')

    @property
    def nombre(self) -> str:
        return self.descripcion or self.codigo


class RolPermiso(BaseDeclarativa):
    __tablename__ = "roles_permisos"

    rol_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permiso_id = Column(UUID(as_uuid=True), ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True)
    asignado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    rol = relationship("Rol", back_populates="permisos_asociados")
    permiso = relationship("Permiso", back_populates="roles_asociados")


class UsuarioRol(BaseDeclarativa):
    __tablename__ = "usuarios_roles"

    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    rol_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="RESTRICT"), primary_key=True)
    asignado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("Usuario", back_populates="roles_asignados")
    rol = relationship("Rol", back_populates="usuarios_asociados")
