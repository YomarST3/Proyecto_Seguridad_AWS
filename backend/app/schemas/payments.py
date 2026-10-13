from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class PaymentMethodResponse(BaseModel):
    id: int
    name: str
    requires_reference: bool
    is_active: bool

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    sale_id: int
    payment_method_id: int
    amount: Decimal = Field(gt=Decimal("0.00"), description="Importe a cobrar")
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    sale_id: int
    sale_code: str
    payment_method_name: str
    amount: Decimal
    reference: Optional[str]
    received_by_name: Optional[str]
    payment_date: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True
