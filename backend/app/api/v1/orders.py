from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import User, OrderStatusEnum
from app.security.deps import get_current_user
from app.schemas.orders import OrderCreate, OrderResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Pedidos"])


@router.get("", response_model=List[OrderResponse])
def list_orders(
    status: Optional[OrderStatusEnum] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OrderService.list_orders(db, current_user.company_id, status_filter=status, limit=limit)


@router.post("", response_model=OrderResponse)
def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp_id = current_user.employee.id if current_user.employee else None
    return OrderService.create_order(
        db=db,
        company_id=current_user.company_id,
        data=data,
        current_user_employee_id=emp_id
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OrderService.get_order(db, current_user.company_id, order_id)


@router.post("/{order_id}/confirm", response_model=OrderResponse)
def confirm_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OrderService.confirm_order(
        db=db,
        company_id=current_user.company_id,
        order_id=order_id,
        user_id=current_user.id
    )


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OrderService.cancel_order(
        db=db,
        company_id=current_user.company_id,
        order_id=order_id,
        user_id=current_user.id
    )
