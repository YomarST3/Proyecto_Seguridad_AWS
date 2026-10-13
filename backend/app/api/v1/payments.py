from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import User
from app.security.deps import get_current_user
from app.schemas.payments import PaymentCreate, PaymentResponse, PaymentMethodResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Pagos & Cobranza"])


@router.get("/methods", response_model=List[PaymentMethodResponse])
def list_payment_methods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PaymentService.list_payment_methods(db)


@router.get("/sale/{sale_id}", response_model=List[PaymentResponse])
def list_sale_payments(
    sale_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PaymentService.list_sale_payments(db, current_user.company_id, sale_id)


@router.post("", response_model=PaymentResponse)
def register_payment(
    data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PaymentService.register_payment(
        db=db,
        company_id=current_user.company_id,
        data=data,
        user_id=current_user.id
    )
