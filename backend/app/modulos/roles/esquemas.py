from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime


class PermisoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    modulo: str
    nombre: str
    descripcion: Optional[str] = None


class RolBase(BaseModel):
    codigo: str = Field(min_length=2, max_length=50)
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str] = None


class RolCrear(RolBase):
    permisos_ids: List[int] = Field(default_factory=list)


class RolRespuesta(RolBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    es_sistema: bool
    activo: bool
    creado_en: datetime
    permisos: List[PermisoRespuesta] = []



class AsignarRolesEsquema(BaseModel):
    roles_ids: List[int] = Field(min_length=1)
