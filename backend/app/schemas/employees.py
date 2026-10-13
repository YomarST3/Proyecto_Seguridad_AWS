from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    doc_number: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    job_title: str = "Vendedor"
    commission_rate: Decimal = Field(default=Decimal("0.05"), ge=Decimal("0.00"), le=Decimal("1.00"))
    monthly_sales_target: Decimal = Field(default=Decimal("10000.00"), ge=Decimal("0.00"))


class EmployeeCreate(EmployeeBase):
    user_id: Optional[int] = None


class EmployeeResponse(EmployeeBase):
    id: int
    company_id: int
    user_id: Optional[int]
    is_active: bool
    hire_date: datetime

    class Config:
        from_attributes = True


class EmployeePerformanceResponse(EmployeeResponse):
    total_sales_count: int = 0
    total_sales_amount: Decimal = Decimal("0.00")
    total_commission_earned: Decimal = Decimal("0.00")
    target_fulfillment_pct: Decimal = Decimal("0.00")
