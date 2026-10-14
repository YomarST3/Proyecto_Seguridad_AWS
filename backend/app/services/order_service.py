from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.entities import (
    Order, OrderDetail, Product, Customer, Employee,
    Inventory, InventoryMovement, OrderStatusEnum, InventoryMovementTypeEnum
)
from app.schemas.orders import OrderCreate, OrderResponse, OrderDetailResponse


class OrderService:
    @staticmethod
    def _build_order_response(order: Order) -> OrderResponse:
        items = []
        for d in order.details:
            items.append(OrderDetailResponse(
                id=d.id,
                product_id=d.product_id,
                product_sku=d.product.sku if d.product else "",
                product_name=d.product.name if d.product else "",
                quantity=d.quantity,
                unit_price=d.unit_price,
                unit_cost=d.unit_cost,
                discount_percentage=d.discount_percentage,
                line_subtotal=d.line_subtotal
            ))

        return OrderResponse(
            id=order.id,
            order_code=order.order_code,
            customer_id=order.customer_id,
            customer_name=order.customer.full_name if order.customer else "",
            salesperson_id=order.salesperson_id,
            salesperson_name=f"{order.salesperson.first_name} {order.salesperson.last_name}" if order.salesperson else "",
            status=order.status,
            subtotal=order.subtotal,
            tax_amount=order.tax_amount,
            discount_amount=order.discount_amount,
            total_amount=order.total_amount,
            notes=order.notes,
            created_at=order.created_at,
            updated_at=order.updated_at,
            items=items
        )

    @staticmethod
    def list_orders(
        db: Session,
        company_id: int,
        status_filter: Optional[OrderStatusEnum] = None,
        limit: int = 50
    ) -> List[OrderResponse]:
        query = db.query(Order).filter(Order.company_id == company_id)
        if status_filter:
            query = query.filter(Order.status == status_filter)
        orders = query.order_by(Order.created_at.desc()).limit(limit).all()
        return [OrderService._build_order_response(o) for o in orders]

    @staticmethod
    def get_order(db: Session, company_id: int, order_id: int) -> OrderResponse:
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.company_id == company_id
        ).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado.")
        return OrderService._build_order_response(order)

    @staticmethod
    def create_order(
        db: Session,
        company_id: int,
        data: OrderCreate,
        current_user_employee_id: Optional[int] = None
    ) -> OrderResponse:
        customer = db.query(Customer).filter(
            Customer.id == data.customer_id,
            Customer.company_id == company_id
        ).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado.")

        salesperson_id = data.salesperson_id or current_user_employee_id
        if not salesperson_id:
            first_emp = db.query(Employee).filter(Employee.company_id == company_id).first()
            if not first_emp:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No existe vendedor registrado.")
            salesperson_id = first_emp.id

        # Generar código único correlativo
        count = db.query(Order).filter(Order.company_id == company_id).count()
        order_code = f"ORD-{datetime.utcnow().year}-{count + 1:04d}"

        subtotal = Decimal("0.00")
        tax_total = Decimal("0.00")
        discount_total = Decimal("0.00")

        order = Order(
            company_id=company_id,
            order_code=order_code,
            customer_id=customer.id,
            salesperson_id=salesperson_id,
            status=OrderStatusEnum.PENDING,
            subtotal=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("0.00"),
            notes=data.notes
        )
        db.add(order)
        db.flush()

        for item in data.items:
            prod = db.query(Product).filter(
                Product.id == item.product_id,
                Product.company_id == company_id
            ).first()
            if not prod:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto {item.product_id} no encontrado.")

            line_gross = prod.sale_price * item.quantity
            line_disc = line_gross * item.discount_percentage
            line_net = line_gross - line_disc
            line_tax = line_net * prod.tax_rate

            subtotal += line_net
            tax_total += line_tax
            discount_total += line_disc

            detail = OrderDetail(
                company_id=company_id,
                order_id=order.id,
                product_id=prod.id,
                quantity=item.quantity,
                unit_price=prod.sale_price,
                unit_cost=prod.cost_price,
                discount_percentage=item.discount_percentage,
                line_subtotal=line_net
            )
            db.add(detail)

        order.subtotal = subtotal
        order.tax_amount = tax_total
        order.discount_amount = discount_total
        order.total_amount = subtotal + tax_total

        db.commit()
        db.refresh(order)
        return OrderService._build_order_response(order)

    @staticmethod
    def confirm_order(
        db: Session,
        company_id: int,
        order_id: int,
        user_id: Optional[int] = None
    ) -> OrderResponse:
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.company_id == company_id
        ).first()

        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado.")

        if order.status != OrderStatusEnum.PENDING and order.status != OrderStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede confirmar un pedido en estado {order.status.value}."
            )

        # Reservar existencias bajo bloqueo
        for d in order.details:
            inv = db.query(Inventory).filter(
                Inventory.product_id == d.product_id
            ).with_for_update().first()

            if not inv:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"No hay inventario para producto {d.product_id}.")

            avail = inv.physical_stock - inv.reserved_stock
            if avail < d.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuficiente para reservar producto '{d.product.name}'. Disponible: {avail}, requerido: {d.quantity}."
                )

            inv.reserved_stock += d.quantity

            mov = InventoryMovement(
                inventory_id=inv.id,
                movement_type=InventoryMovementTypeEnum.RESERVE,
                quantity=d.quantity,
                previous_stock=inv.physical_stock,
                resulting_stock=inv.physical_stock,
                reference_doc=order.order_code,
                reason="Reserva de existencias por pedido comercial confirmado",
                user_id=user_id
            )
            db.add(mov)

        order.status = OrderStatusEnum.CONFIRMED
        db.commit()
        db.refresh(order)
        return OrderService._build_order_response(order)

    @staticmethod
    def cancel_order(
        db: Session,
        company_id: int,
        order_id: int,
        user_id: Optional[int] = None
    ) -> OrderResponse:
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.company_id == company_id
        ).first()

        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado.")

        if order.status == OrderStatusEnum.FULFILLED or order.status == OrderStatusEnum.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede cancelar un pedido con estado {order.status.value}."
            )

        # Si estaba confirmado, liberar existencias reservadas
        if order.status == OrderStatusEnum.CONFIRMED:
            for d in order.details:
                inv = db.query(Inventory).filter(
                    Inventory.product_id == d.product_id
                ).with_for_update().first()

                if inv:
                    inv.reserved_stock = max(0, inv.reserved_stock - d.quantity)
                    mov = InventoryMovement(
                        inventory_id=inv.id,
                        movement_type=InventoryMovementTypeEnum.RELEASE,
                        quantity=d.quantity,
                        previous_stock=inv.physical_stock,
                        resulting_stock=inv.physical_stock,
                        reference_doc=order.order_code,
                        reason="Liberación de reserva por cancelación de pedido comercial",
                        user_id=user_id
                    )
                    db.add(mov)

        order.status = OrderStatusEnum.CANCELLED
        db.commit()
        db.refresh(order)
        return OrderService._build_order_response(order)
