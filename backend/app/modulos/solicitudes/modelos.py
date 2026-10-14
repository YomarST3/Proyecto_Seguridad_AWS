import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.nucleo.base_datos import BaseDeclarativa
import app.modulos.empresas.modelos  # noqa: F401
import app.modulos.usuarios.modelos  # noqa: F401


class SolicitudAcceso(BaseDeclarativa):
    __tablename__ = "solicitudes_acceso"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    auth_usuario_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    estado = Column(String(20), default="PENDIENTE", nullable=False, index=True)  # PENDIENTE, APROBADA, RECHAZADA
    creada_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    revisada_en = Column(DateTime, nullable=True)
    revisada_por = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    observacion = Column(Text, nullable=True)

    revisado_por_usuario = relationship("Usuario", foreign_keys=[revisada_por])

    @property
    def usuario_id(self) -> uuid.UUID:
        return self.auth_usuario_id

    @property
    def motivo(self) -> str:
        return self.observacion or ""
