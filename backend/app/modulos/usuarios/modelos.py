import uuid
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.nucleo.base_datos import BaseDeclarativa
import app.modulos.empresas.modelos  # noqa: F401
import app.modulos.roles.modelos     # noqa: F401


class Usuario(BaseDeclarativa):
    __tablename__ = "usuarios"

    # Vinculado 1:1 con auth.users.id de Supabase
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="RESTRICT"), nullable=False, index=True)
    nombre_completo = Column(String(150), nullable=False)
    correo_electronico = Column(String(120), nullable=False, unique=True, index=True)
    telefono = Column(String(50), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    ultimo_acceso = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa", back_populates="usuarios")
    roles_asignados = relationship("UsuarioRol", back_populates="usuario", foreign_keys="[UsuarioRol.usuario_id]", cascade="all, delete-orphan")
