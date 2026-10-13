from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.entities import InventoryMovementTypeEnum


class InventoryMovementCreate(BaseModel):
    product_id: int
    movement_type: InventoryMovementTypeEnum
    quantity: int = Field(gt=0, description="Cantidad positiva a mover")
    reason: str
    reference_doc: Optional[str] = None


class InventoryMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inventory_id: int
    product_id: int
    product_name: str
    product_sku: str
    movement_type: InventoryMovementTypeEnum
    quantity: int
    previous_stock: int
    resulting_stock: int
    reference_doc: Optional[str]
    reason: Optional[str]
    user_name: Optional[str]
    created_at: datetime


class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    sku: str
    product_name: str
    category_name: str
    physical_stock: int
    reserved_stock: int
    available_stock: int
    min_stock_alert: int
    is_low_stock: bool
    updated_at: datetime

