from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import User
from app.security.deps import get_current_user
from app.schemas.customers import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerDetailResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Clientes"])


@router.get("", response_model=List[CustomerResponse])
def list_customers(
    search: Optional[str] = Query(None, description="Buscar por nombre, documento o email"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CustomerService.list_customers(
        db=db,
        company_id=current_user.company_id,
        search=search,
        limit=limit,
        offset=offset
    )


@router.post("", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CustomerService.create_customer(
        db=db,
        company_id=current_user.company_id,
        data=data
    )


@router.get("/{customer_id}", response_model=CustomerDetailResponse)
def get_customer_detail(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CustomerService.get_customer_detail(
        db=db,
        company_id=current_user.company_id,
        customer_id=customer_id
    )


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CustomerService.update_customer(
        db=db,
        company_id=current_user.company_id,
        customer_id=customer_id,
        data=data
    )
