from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class SolicitudAccesoCrear(BaseModel):
    usuario_id: UUID = Field(description="UUID originado desde Supabase Auth (auth.users)")
    empresa_id: int = Field(default=1, description="ID de la empresa a la que solicita unirse")
    nombre_completo: str = Field(min_length=2, max_length=150)
    correo_electronico: EmailStr
    motivo: Optional[str] = Field(default=None, max_length=255)


class SolicitudAccesoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    auth_usuario_id: UUID
    estado: str
    revisada_por: Optional[UUID] = None
    revisada_en: Optional[datetime] = None
    creada_en: datetime
    observacion: Optional[str] = None


class SolicitudAprobar(BaseModel):
    roles_ids: List[int] = Field(min_length=1, description="Lista de IDs de roles a asignar")


class SolicitudRechazar(BaseModel):
    motivo: Optional[str] = Field(default=None, max_length=255)
