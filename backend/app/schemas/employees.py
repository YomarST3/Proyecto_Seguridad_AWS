from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


from typing import Optional, Any
from uuid import UUID

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
    user_id: Optional[Any] = None


class EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: Any
    company_id: Any
    user_id: Optional[Any]
    doc_number: Optional[str] = None
    job_title: str = "Vendedor"
    is_active: bool
    hire_date: Optional[date] = None


class EmployeePerformanceResponse(EmployeeResponse):
    total_sales_count: int = 0
    total_sales_amount: Decimal = Decimal("0.00")
    total_commission_earned: Decimal = Decimal("0.00")
    target_fulfillment_pct: Decimal = Decimal("0.00")

