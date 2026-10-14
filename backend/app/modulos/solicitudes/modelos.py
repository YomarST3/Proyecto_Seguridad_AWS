import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.nucleo.base_datos import BaseDeclarativa
import app.modulos.empresas.modelos  # noqa: F401
import app.modulos.usuarios.modelos  # noqa: F401


class SolicitudAcceso(BaseDeclarativa):
    __tablename__ = "solicitudes_acceso"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    # Vinculado con auth.users.id de Supabase (la FK está establecida en DDL de PostgreSQL)
    usuario_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="RESTRICT"), nullable=False, index=True)

    nombre_completo = Column(String(150), nullable=False)
    correo_electronico = Column(String(120), nullable=False, index=True)
    motivo = Column(String(255), nullable=True)
    estado = Column(String(30), default="PENDIENTE", nullable=False, index=True)  # PENDIENTE, APROBADA, RECHAZADA
    revisado_por_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    creado_en = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa")
    revisado_por = relationship("Usuario", foreign_keys=[revisado_por_id])
