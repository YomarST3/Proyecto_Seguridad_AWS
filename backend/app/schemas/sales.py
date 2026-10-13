from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.models.entities import SaleStatusEnum, PaymentStatusEnum


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))


class SaleCreate(BaseModel):
    customer_id: int
    salesperson_id: Optional[int] = None
    order_id: Optional[int] = None # Si proviene de pedido
    items: List[SaleItemCreate] = Field(min_length=1)
    payment_method_id: Optional[int] = None # Opcional: pago inicial al momento de la venta
    payment_reference: Optional[str] = None
    paid_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class SaleDetailResponse(BaseModel):
    id: int
    product_id: int
    product_sku: str
    product_name: str
    quantity: int
    unit_cost: Decimal
    unit_price: Decimal
    tax_rate: Decimal
    discount_amount: Decimal
    line_subtotal: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    sale_code: str
    customer_id: int
    customer_name: str
    salesperson_id: int
    salesperson_name: str
    status: SaleStatusEnum
    payment_status: PaymentStatusEnum
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    pending_balance: Decimal
    notes: Optional[str]
    created_at: datetime
    items: List[SaleDetailResponse] = []

    class Config:
        from_attributes = True
