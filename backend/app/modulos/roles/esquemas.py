from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class PermisoRespuesta(BaseModel):
    id: int
    codigo: str
    modulo: str
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True


class RolBase(BaseModel):
    codigo: str = Field(min_length=2, max_length=50)
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str] = None


class RolCrear(RolBase):
    permisos_ids: List[int] = Field(default_factory=list)


class RolRespuesta(RolBase):
    id: int
    empresa_id: int
    es_sistema: bool
    activo: bool
    creado_en: datetime
    permisos: List[PermisoRespuesta] = []

    class Config:
        from_attributes = True


class AsignarRolesEsquema(BaseModel):
    roles_ids: List[int] = Field(min_length=1)
