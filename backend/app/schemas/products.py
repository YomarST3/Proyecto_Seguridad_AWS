from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    is_active: bool


class ProductBase(BaseModel):
    category_id: int
    sku: str
    name: str
    description: Optional[str] = None
    cost_price: Decimal = Field(ge=Decimal("0.00"), description="Costo de adquisición unitario")
    sale_price: Decimal = Field(ge=Decimal("0.00"), description="Precio base de venta")
    tax_rate: Decimal = Field(default=Decimal("0.18"), ge=Decimal("0.00"), le=Decimal("1.00"))
    min_stock_alert: int = Field(default=5, ge=0)
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    initial_stock: int = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    min_stock_alert: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    category_name: Optional[str] = None
    unit_margin: Decimal = Decimal("0.00")
    margin_percentage: Decimal = Decimal("0.00")
    physical_stock: int = 0
    reserved_stock: int = 0
    available_stock: int = 0
    is_active: bool
    created_at: datetime
    updated_at: datetime

