import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, synonym
from app.nucleo.base_datos import BaseDeclarativa
import app.modulos.empresas.modelos  # noqa: F401
import app.modulos.roles.modelos     # noqa: F401


class Usuario(BaseDeclarativa):
    __tablename__ = "usuarios"

    # Vinculado 1:1 con auth.users.id de Supabase
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="RESTRICT"), nullable=False, index=True)
    nombre_completo = Column(String(180), nullable=False)
    correo = Column(String(255), nullable=False, unique=True, index=True)
    telefono = Column(String(30), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa", back_populates="usuarios")
    roles_asignados = relationship("UsuarioRol", back_populates="usuario", foreign_keys="[UsuarioRol.usuario_id]", cascade="all, delete-orphan")
    empleado = relationship("Empleado", back_populates="usuario", uselist=False)

    correo_electronico = synonym('correo')
    company_id = synonym('empresa_id')
    email = synonym('correo')
    full_name = synonym('nombre_completo')
    phone = synonym('telefono')
    is_active = synonym('activo')
    created_at = synonym('creado_en')
    updated_at = synonym('actualizado_en')

    @property
    def role(self):
        if self.roles_asignados and len(self.roles_asignados) > 0 and self.roles_asignados[0].rol:
            return self.roles_asignados[0].rol
        return None

    @property
    def ultimo_acceso(self):
        return None

    @ultimo_acceso.setter
    def ultimo_acceso(self, val):
        pass

