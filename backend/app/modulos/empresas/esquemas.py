from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from decimal import Decimal


class EmpresaBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=200)
    identificador_fiscal: str = Field(min_length=5, max_length=50, description="RUC o NIF único")
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    correo_electronico: Optional[EmailStr] = None
    moneda: str = Field(default="USD", max_length=10)
    tasa_impuesto: Decimal = Field(default=Decimal("0.1800"), ge=Decimal("0.0"), le=Decimal("1.0"))


class EmpresaCrear(EmpresaBase):
    pass


class EmpresaActualizar(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    correo_electronico: Optional[EmailStr] = None
    tasa_impuesto: Optional[Decimal] = None
    activo: Optional[bool] = None


class EmpresaRespuesta(EmpresaBase):
    id: int
    activo: bool
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True
