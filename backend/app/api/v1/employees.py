from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import User
from app.security.deps import get_current_user
from app.schemas.employees import EmployeeResponse, EmployeePerformanceResponse
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/employees", tags=["Personal & Vendedores"])


@router.get("", response_model=List[EmployeeResponse])
def list_employees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return EmployeeService.list_employees(db, current_user.company_id)


@router.get("/{employee_id}/performance", response_model=EmployeePerformanceResponse)
def get_employee_performance(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return EmployeeService.get_employee_performance(db, current_user.company_id, employee_id)
