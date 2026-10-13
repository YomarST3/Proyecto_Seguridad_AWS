from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.entities import Inventory, InventoryMovement, Product, Category, InventoryMovementTypeEnum
from app.schemas.inventory import InventoryItemResponse, InventoryMovementCreate, InventoryMovementResponse


class InventoryService:
    @staticmethod
    def list_inventory(
        db: Session,
        company_id: int,
        low_stock_only: bool = False
    ) -> List[InventoryItemResponse]:
        query = db.query(Inventory, Product, Category).join(
            Product, Product.id == Inventory.product_id
        ).join(
            Category, Category.id == Product.category_id, isouter=True
        ).filter(Product.company_id == company_id)

        items = []
        for inv, prod, cat in query.all():
            avail = inv.physical_stock - inv.reserved_stock
            is_low = avail <= prod.min_stock_alert

            if low_stock_only and not is_low:
                continue

            items.append(InventoryItemResponse(
                id=inv.id,
                product_id=prod.id,
                sku=prod.sku,
                product_name=prod.name,
                category_name=cat.name if cat else "Sin categoría",
                physical_stock=inv.physical_stock,
                reserved_stock=inv.reserved_stock,
                available_stock=avail,
                min_stock_alert=prod.min_stock_alert,
                is_low_stock=is_low,
                updated_at=inv.updated_at
            ))
        return items

    @staticmethod
    def register_movement(
        db: Session,
        company_id: int,
        data: InventoryMovementCreate,
        user_id: Optional[int] = None
    ) -> InventoryMovementResponse:
        prod = db.query(Product).filter(
            Product.id == data.product_id,
            Product.company_id == company_id
        ).first()

        if not prod:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

        # Bloqueo pesimista para evitar concurrencia en la fila de inventario
        inv = db.query(Inventory).filter(
            Inventory.product_id == prod.id
        ).with_for_update().first()

        if not inv:
            inv = Inventory(product_id=prod.id, physical_stock=0, reserved_stock=0)
            db.add(inv)
            db.flush()

        previous = inv.physical_stock
        resulting = previous

        if data.movement_type == InventoryMovementTypeEnum.ENTRY:
            resulting = previous + data.quantity
            inv.physical_stock = resulting

        elif data.movement_type == InventoryMovementTypeEnum.EXIT:
            avail = inv.physical_stock - inv.reserved_stock
            if avail < data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock disponible insuficiente ({avail}) para realizar salida de {data.quantity} unidades."
                )
            resulting = previous - data.quantity
            inv.physical_stock = resulting

        elif data.movement_type == InventoryMovementTypeEnum.ADJUSTMENT:
            # En ajuste se puede especificar variación neta o corrección
            resulting = data.quantity # Asume nuevo conteo físico auditado
            if resulting < inv.reserved_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El nuevo stock ({resulting}) no puede ser menor a las unidades ya reservadas ({inv.reserved_stock})."
                )
            inv.physical_stock = resulting

        mov = InventoryMovement(
            inventory_id=inv.id,
            movement_type=data.movement_type,
            quantity=data.quantity,
            previous_stock=previous,
            resulting_stock=resulting,
            reference_doc=data.reference_doc or "AJUSTE_MANUAL",
            reason=data.reason,
            user_id=user_id
        )
        db.add(mov)
        db.commit()
        db.refresh(mov)

        return InventoryMovementResponse(
            id=mov.id,
            inventory_id=inv.id,
            product_id=prod.id,
            product_name=prod.name,
            product_sku=prod.sku,
            movement_type=mov.movement_type,
            quantity=mov.quantity,
            previous_stock=mov.previous_stock,
            resulting_stock=mov.resulting_stock,
            reference_doc=mov.reference_doc,
            reason=mov.reason,
            user_name="Usuario",
            created_at=mov.created_at
        )

    @staticmethod
    def list_movements(
        db: Session,
        company_id: int,
        product_id: Optional[int] = None,
        limit: int = 50
    ) -> List[InventoryMovementResponse]:
        query = db.query(InventoryMovement, Inventory, Product).join(
            Inventory, Inventory.id == InventoryMovement.inventory_id
        ).join(
            Product, Product.id == Inventory.product_id
        ).filter(Product.company_id == company_id)

        if product_id:
            query = query.filter(Product.id == product_id)

        results = query.order_by(InventoryMovement.created_at.desc()).limit(limit).all()

        movements = []
        for mov, inv, prod in results:
            movements.append(InventoryMovementResponse(
                id=mov.id,
                inventory_id=inv.id,
                product_id=prod.id,
                product_name=prod.name,
                product_sku=prod.sku,
                movement_type=mov.movement_type,
                quantity=mov.quantity,
                previous_stock=mov.previous_stock,
                resulting_stock=mov.resulting_stock,
                reference_doc=mov.reference_doc,
                reason=mov.reason,
                user_name="Usuario",
                created_at=mov.created_at
            ))
        return movements
