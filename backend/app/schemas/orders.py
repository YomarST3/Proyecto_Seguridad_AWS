from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.models.entities import OrderStatusEnum


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, description="Cantidad mayor a cero")
    discount_percentage: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"), le=Decimal("1.00"))


class OrderCreate(BaseModel):
    customer_id: int
    salesperson_id: Optional[int] = None
    items: List[OrderItemCreate] = Field(min_length=1)
    notes: Optional[str] = None


class OrderDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_sku: str
    product_name: str
    quantity: int
    unit_price: Decimal
    unit_cost: Decimal
    discount_percentage: Decimal
    line_subtotal: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_code: str
    customer_id: int
    customer_name: str
    salesperson_id: int
    salesperson_name: str
    status: OrderStatusEnum
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[OrderDetailResponse] = []

