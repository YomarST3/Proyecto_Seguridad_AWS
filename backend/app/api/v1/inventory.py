from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import User
from app.security.deps import get_current_user
from app.schemas.inventory import (
    InventoryItemResponse, InventoryMovementCreate, InventoryMovementResponse
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventario"])


@router.get("", response_model=List[InventoryItemResponse])
def list_inventory(
    low_stock_only: bool = Query(False, description="Filtrar solo productos en riesgo de desabastecimiento"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return InventoryService.list_inventory(db, current_user.company_id, low_stock_only=low_stock_only)


@router.post("/movements", response_model=InventoryMovementResponse)
def register_movement(
    data: InventoryMovementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return InventoryService.register_movement(
        db=db,
        company_id=current_user.company_id,
        data=data,
        user_id=current_user.id
    )


@router.get("/movements", response_model=List[InventoryMovementResponse])
def list_movements(
    product_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return InventoryService.list_movements(
        db=db,
        company_id=current_user.company_id,
        product_id=product_id,
        limit=limit
    )
