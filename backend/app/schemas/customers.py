from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.entities import CustomerTypeEnum


class CustomerBase(BaseModel):
    customer_type: CustomerTypeEnum = CustomerTypeEnum.NATURAL
    full_name: str
    doc_type: str = "DNI"
    doc_number: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    customer_type: Optional[CustomerTypeEnum] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerResponse(CustomerBase):
    id: int
    company_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerDetailResponse(CustomerResponse):
    total_purchases_count: int = 0
    total_amount_spent: Decimal = Decimal("0.00")
    average_ticket: Decimal = Decimal("0.00")
    last_purchase_date: Optional[datetime] = None
    purchase_frequency_days: Optional[float] = None
