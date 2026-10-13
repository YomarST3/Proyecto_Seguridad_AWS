from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.entities import Product, Category, Inventory, InventoryMovement, InventoryMovementTypeEnum
from app.schemas.products import (
    ProductCreate, ProductUpdate, ProductResponse,
    CategoryCreate, CategoryResponse
)


class ProductService:
    @staticmethod
    def _build_product_response(p: Product, inv: Optional[Inventory] = None, cat: Optional[Category] = None) -> ProductResponse:
        phys = inv.physical_stock if inv else 0
        res = inv.reserved_stock if inv else 0
        avail = phys - res

        # Margen = Precio Venta Neto - Costo Unitario
        margin = p.sale_price - p.cost_price
        # Margen Porcentual = (Margen / Precio Venta) * 100
        margin_pct = (margin / p.sale_price * Decimal("100.0")) if p.sale_price > Decimal("0.00") else Decimal("0.00")

        return ProductResponse(
            id=p.id,
            company_id=p.company_id,
            category_id=p.category_id,
            category_name=cat.name if cat else (p.category.name if p.category else "Sin categoría"),
            sku=p.sku,
            name=p.name,
            description=p.description,
            cost_price=p.cost_price,
            sale_price=p.sale_price,
            tax_rate=p.tax_rate,
            min_stock_alert=p.min_stock_alert,
            image_url=p.image_url,
            unit_margin=round(margin, 2),
            margin_percentage=round(margin_pct, 2),
            physical_stock=phys,
            reserved_stock=res,
            available_stock=avail,
            is_active=p.is_active,
            created_at=p.created_at,
            updated_at=p.updated_at
        )

    @staticmethod
    def list_products(
        db: Session,
        company_id: int,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ProductResponse]:
        query = db.query(Product, Inventory, Category).join(
            Inventory, Inventory.product_id == Product.id, isouter=True
        ).join(
            Category, Category.id == Product.category_id, isouter=True
        ).filter(Product.company_id == company_id)

        if category_id:
            query = query.filter(Product.category_id == category_id)

        if search:
            search_fmt = f"%{search.strip()}%"
            query = query.filter(
                (Product.name.ilike(search_fmt)) |
                (Product.sku.ilike(search_fmt))
            )

        results = query.order_by(Product.name.asc()).offset(offset).limit(limit).all()
        return [ProductService._build_product_response(p, inv, cat) for p, inv, cat in results]

    @staticmethod
    def get_product(db: Session, company_id: int, product_id: int) -> ProductResponse:
        row = db.query(Product, Inventory, Category).join(
            Inventory, Inventory.product_id == Product.id, isouter=True
        ).join(
            Category, Category.id == Product.category_id, isouter=True
        ).filter(Product.id == product_id, Product.company_id == company_id).first()

        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

        p, inv, cat = row
        return ProductService._build_product_response(p, inv, cat)

    @staticmethod
    def create_product(
        db: Session,
        company_id: int,
        data: ProductCreate,
        user_id: Optional[int] = None
    ) -> ProductResponse:
        existing = db.query(Product).filter(
            Product.company_id == company_id,
            Product.sku == data.sku
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El SKU '{data.sku}' ya está registrado en el catálogo de esta empresa."
            )

        new_prod = Product(
            company_id=company_id,
            category_id=data.category_id,
            sku=data.sku.upper().strip(),
            name=data.name.strip(),
            description=data.description,
            cost_price=data.cost_price,
            sale_price=data.sale_price,
            tax_rate=data.tax_rate,
            min_stock_alert=data.min_stock_alert,
            image_url=data.image_url,
            is_active=True
        )
        db.add(new_prod)
        db.flush()

        # Crear registro de inventario desacoplado
        inv = Inventory(
            product_id=new_prod.id,
            physical_stock=data.initial_stock,
            reserved_stock=0
        )
        db.add(inv)
        db.flush()

        if data.initial_stock > 0:
            mov = InventoryMovement(
                inventory_id=inv.id,
                movement_type=InventoryMovementTypeEnum.ENTRY,
                quantity=data.initial_stock,
                previous_stock=0,
                resulting_stock=data.initial_stock,
                reference_doc="ALTA_PRODUCTO",
                reason="Stock inicial registrado al dar de alta el producto",
                user_id=user_id
            )
            db.add(mov)

        db.commit()
        db.refresh(new_prod)
        return ProductService._build_product_response(new_prod, inv)

    @staticmethod
    def update_product(
        db: Session,
        company_id: int,
        product_id: int,
        data: ProductUpdate
    ) -> ProductResponse:
        prod = db.query(Product).filter(
            Product.id == product_id,
            Product.company_id == company_id
        ).first()

        if not prod:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

        update_dict = data.model_dump(exclude_unset=True)
        for field, val in update_dict.items():
            setattr(prod, field, val)

        db.commit()
        db.refresh(prod)
        inv = db.query(Inventory).filter(Inventory.product_id == prod.id).first()
        return ProductService._build_product_response(prod, inv)

    @staticmethod
    def list_categories(db: Session, company_id: int) -> List[CategoryResponse]:
        cats = db.query(Category).filter(
            Category.company_id == company_id,
            Category.is_active == True
        ).order_by(Category.name.asc()).all()
        return [CategoryResponse.model_validate(c) for c in cats]

    @staticmethod
    def create_category(db: Session, company_id: int, data: CategoryCreate) -> CategoryResponse:
        existing = db.query(Category).filter(
            Category.company_id == company_id,
            Category.name == data.name
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La categoría '{data.name}' ya existe."
            )

        cat = Category(
            company_id=company_id,
            name=data.name.strip(),
            description=data.description,
            is_active=True
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return CategoryResponse.model_validate(cat)
