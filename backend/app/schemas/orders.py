from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
from datetime import datetime
from decimal import Decimal
from app.models.entities import OrderStatusEnum


class OrderItemCreate(BaseModel):
    product_id: Any
    quantity: int = Field(gt=0, description="Cantidad mayor a cero")
    discount_percentage: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"), le=Decimal("1.00"))


class OrderCreate(BaseModel):
    customer_id: Any
    salesperson_id: Optional[Any] = None
    items: List[OrderItemCreate] = Field(min_length=1)
    notes: Optional[str] = None


class OrderDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Any
    product_id: Any
    product_sku: str
    product_name: str
    quantity: int
    unit_price: Decimal
    unit_cost: Decimal
    discount_percentage: Decimal = Decimal("0.00")
    line_subtotal: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Any
    order_code: str
    customer_id: Any
    customer_name: str
    salesperson_id: Optional[Any] = None
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
