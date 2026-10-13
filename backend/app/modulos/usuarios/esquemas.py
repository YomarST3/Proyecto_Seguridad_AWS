from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from app.modulos.roles.esquemas import RolRespuesta


class UsuarioBase(BaseModel):
    nombre_completo: str = Field(min_length=2, max_length=150)
    correo_electronico: EmailStr
    telefono: Optional[str] = None


class UsuarioCrear(UsuarioBase):
    id: UUID = Field(description="UUID originado desde Supabase Auth (auth.users)")
    empresa_id: int
    roles_ids: List[int] = Field(default_factory=list)


class UsuarioActualizar(BaseModel):
    nombre_completo: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None


class UsuarioRespuesta(UsuarioBase):
    id: UUID
    empresa_id: int
    activo: bool
    ultimo_acceso: Optional[datetime] = None
    creado_en: datetime
    actualizado_en: datetime
    roles: List[str] = []

    class Config:
        from_attributes = True


class UsuarioPerfilRespuesta(UsuarioRespuesta):
    permisos: List[str] = []
