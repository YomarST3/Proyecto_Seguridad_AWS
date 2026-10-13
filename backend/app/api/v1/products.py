from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import User
from app.security.deps import get_current_user
from app.schemas.products import (
    ProductCreate, ProductUpdate, ProductResponse,
    CategoryCreate, CategoryResponse
)
from app.services.product_service import ProductService

router = APIRouter(tags=["Productos & Categorías"])


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ProductService.list_categories(db, current_user.company_id)


@router.post("/categories", response_model=CategoryResponse)
def create_category(
    data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ProductService.create_category(db, current_user.company_id, data)


@router.get("/products", response_model=List[ProductResponse])
def list_products(
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ProductService.list_products(
        db=db,
        company_id=current_user.company_id,
        category_id=category_id,
        search=search,
        limit=limit,
        offset=offset
    )


@router.post("/products", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ProductService.create_product(
        db=db,
        company_id=current_user.company_id,
        data=data,
        user_id=current_user.id
    )


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ProductService.get_product(db, current_user.company_id, product_id)


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ProductService.update_product(db, current_user.company_id, product_id, data)
