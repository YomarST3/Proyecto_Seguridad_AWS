from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import User, SaleStatusEnum
from app.security.deps import get_current_user
from app.schemas.sales import SaleCreate, SaleResponse
from app.services.sale_service import SaleService

router = APIRouter(prefix="/sales", tags=["Ventas"])


@router.get("", response_model=List[SaleResponse])
def list_sales(
    status: Optional[SaleStatusEnum] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return SaleService.list_sales(
        db=db,
        company_id=current_user.company_id,
        status_filter=status,
        limit=limit,
        offset=offset
    )


@router.post("", response_model=SaleResponse)
def create_sale(
    data: SaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp_id = current_user.employee.id if current_user.employee else None
    return SaleService.create_sale(
        db=db,
        company_id=current_user.company_id,
        data=data,
        current_user_id=current_user.id,
        current_user_employee_id=emp_id
    )


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return SaleService.get_sale(db, current_user.company_id, sale_id)


@router.post("/{sale_id}/annul", response_model=SaleResponse)
def annul_sale(
    sale_id: int,
    reason: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return SaleService.annul_sale(
        db=db,
        company_id=current_user.company_id,
        sale_id=sale_id,
        reason=reason,
        user_id=current_user.id
    )
