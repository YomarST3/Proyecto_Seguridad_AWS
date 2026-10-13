from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.entities import (
    Sale, SaleDetail, Order, Product, Customer, Employee,
    Inventory, InventoryMovement, Payment, PaymentMethod, AuditLog,
    SaleStatusEnum, PaymentStatusEnum, OrderStatusEnum, InventoryMovementTypeEnum
)
from app.schemas.sales import SaleCreate, SaleResponse, SaleDetailResponse


class SaleService:
    @staticmethod
    def _build_sale_response(sale: Sale) -> SaleResponse:
        items = []
        for d in sale.details:
            items.append(SaleDetailResponse(
                id=d.id,
                product_id=d.product_id,
                product_sku=d.product.sku if d.product else "",
                product_name=d.product.name if d.product else "",
                quantity=d.quantity,
                unit_cost=d.unit_cost,
                unit_price=d.unit_price,
                tax_rate=d.tax_rate,
                discount_amount=d.discount_amount,
                line_subtotal=d.line_subtotal,
                line_total=d.line_total
            ))

        pending = max(Decimal("0.00"), sale.total_amount - sale.paid_amount)

        return SaleResponse(
            id=sale.id,
            sale_code=sale.sale_code,
            customer_id=sale.customer_id,
            customer_name=sale.customer.full_name if sale.customer else "",
            salesperson_id=sale.salesperson_id,
            salesperson_name=f"{sale.salesperson.first_name} {sale.salesperson.last_name}" if sale.salesperson else "",
            status=sale.status,
            payment_status=sale.payment_status,
            subtotal=sale.subtotal,
            tax_amount=sale.tax_amount,
            discount_amount=sale.discount_amount,
            total_amount=sale.total_amount,
            paid_amount=sale.paid_amount,
            pending_balance=round(pending, 2),
            notes=sale.notes,
            created_at=sale.created_at,
            items=items
        )

    @staticmethod
    def list_sales(
        db: Session,
        company_id: int,
        status_filter: Optional[SaleStatusEnum] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[SaleResponse]:
        query = db.query(Sale).filter(Sale.company_id == company_id)
        if status_filter:
            query = query.filter(Sale.status == status_filter)
        sales = query.order_by(Sale.created_at.desc()).offset(offset).limit(limit).all()
        return [SaleService._build_sale_response(s) for s in sales]

    @staticmethod
    def get_sale(db: Session, company_id: int, sale_id: int) -> SaleResponse:
        sale = db.query(Sale).filter(
            Sale.id == sale_id,
            Sale.company_id == company_id
        ).first()
        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada.")
        return SaleService._build_sale_response(sale)

    @staticmethod
    def create_sale(
        db: Session,
        company_id: int,
        data: SaleCreate,
        current_user_id: Optional[int] = None,
        current_user_employee_id: Optional[int] = None
    ) -> SaleResponse:
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

        # Si proviene de un pedido, validar y no duplicar descuento
        order: Optional[Order] = None
        if data.order_id:
            order = db.query(Order).filter(
                Order.id == data.order_id,
                Order.company_id == company_id
            ).first()
            if not order:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido asociado no encontrado.")
            if order.status == OrderStatusEnum.FULFILLED or order.status == OrderStatusEnum.CANCELLED:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El pedido ya fue atendido o cancelado.")

        # Generar código correlativo de venta
        count = db.query(Sale).filter(Sale.company_id == company_id).count()
        sale_code = f"VTA-{datetime.utcnow().year}-{count + 1:04d}"

        sale = Sale(
            company_id=company_id,
            sale_code=sale_code,
            order_id=order.id if order else None,
            customer_id=customer.id,
            salesperson_id=salesperson_id,
            status=SaleStatusEnum.CONFIRMED,
            payment_status=PaymentStatusEnum.PENDING,
            subtotal=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
            notes=data.notes
        )
        db.add(sale)
        db.flush()

        subtotal = Decimal("0.00")
        tax_total = Decimal("0.00")
        discount_total = Decimal("0.00")

        # Procesar líneas y afectar inventario atómicamente
        for item in data.items:
            prod = db.query(Product).filter(
                Product.id == item.product_id,
                Product.company_id == company_id
            ).first()
            if not prod:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto {item.product_id} no existe.")

            line_gross = prod.sale_price * item.quantity
            line_disc = item.discount_amount
            line_net = max(Decimal("0.00"), line_gross - line_disc)
            line_tax = line_net * prod.tax_rate
            line_tot = line_net + line_tax

            subtotal += line_net
            tax_total += line_tax
            discount_total += line_disc

            # Guardar detalle con snapshot inmutable de precios y costos
            detail = SaleDetail(
                sale_id=sale.id,
                product_id=prod.id,
                quantity=item.quantity,
                unit_cost=prod.cost_price,
                unit_price=prod.sale_price,
                tax_rate=prod.tax_rate,
                discount_amount=line_disc,
                line_subtotal=line_net,
                line_total=line_tot
            )
            db.add(detail)

            # Afectar inventario bajo bloqueo
            inv = db.query(Inventory).filter(
                Inventory.product_id == prod.id
            ).with_for_update().first()

            if not inv:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"No hay inventario para {prod.name}.")

            if order and order.status == OrderStatusEnum.CONFIRMED:
                # Transmuta la reserva existente a salida definitiva (evita doble descuento)
                inv.reserved_stock = max(0, inv.reserved_stock - item.quantity)
                prev_phys = inv.physical_stock
                inv.physical_stock -= item.quantity
            else:
                # Venta directa: verificar stock disponible
                avail = inv.physical_stock - inv.reserved_stock
                if avail < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Stock insuficiente para {prod.name}. Disponible: {avail}, requerido: {item.quantity}."
                    )
                prev_phys = inv.physical_stock
                inv.physical_stock -= item.quantity

            mov = InventoryMovement(
                inventory_id=inv.id,
                movement_type=InventoryMovementTypeEnum.EXIT,
                quantity=item.quantity,
                previous_stock=prev_phys,
                resulting_stock=inv.physical_stock,
                reference_doc=sale_code,
                reason="Salida por venta comercial facturada",
                user_id=current_user_id
            )
            db.add(mov)

        sale.subtotal = subtotal
        sale.tax_amount = tax_total
        sale.discount_amount = discount_total
        sale.total_amount = subtotal + tax_total

        # Si el pedido existía, marcarlo como atendido
        if order:
            order.status = OrderStatusEnum.FULFILLED

        # Registrar pago inicial si fue provisto
        if data.paid_amount and data.paid_amount > Decimal("0.00") and data.payment_method_id:
            pm = db.query(PaymentMethod).filter(PaymentMethod.id == data.payment_method_id).first()
            if not pm:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Método de pago no válido.")

            pay_amount = min(data.paid_amount, sale.total_amount)
            payment = Payment(
                sale_id=sale.id,
                payment_method_id=pm.id,
                amount=pay_amount,
                reference=data.payment_reference or "PAGO_DIRECTO",
                received_by_user_id=current_user_id,
                payment_date=datetime.utcnow(),
                notes="Cobro procesado al emitir venta"
            )
            db.add(payment)
            sale.paid_amount = pay_amount
            sale.payment_status = PaymentStatusEnum.PAID if pay_amount >= sale.total_amount else PaymentStatusEnum.PARTIAL

        # Registrar en auditoría
        audit = AuditLog(
            company_id=company_id,
            user_id=current_user_id,
            action="SALE_CREATED",
            entity_affected="sales",
            entity_id=sale.id,
            details=f"Venta {sale_code} por total {sale.total_amount}"
        )
        db.add(audit)

        db.commit()
        db.refresh(sale)
        return SaleService._build_sale_response(sale)

    @staticmethod
    def annul_sale(
        db: Session,
        company_id: int,
        sale_id: int,
        reason: str,
        user_id: Optional[int] = None
    ) -> SaleResponse:
        sale = db.query(Sale).filter(
            Sale.id == sale_id,
            Sale.company_id == company_id
        ).first()

        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada.")

        if sale.status == SaleStatusEnum.ANNULLED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La venta ya está anulada.")

        # Reingresar mercancía física al inventario
        for d in sale.details:
            inv = db.query(Inventory).filter(
                Inventory.product_id == d.product_id
            ).with_for_update().first()

            if inv:
                prev_stock = inv.physical_stock
                inv.physical_stock += d.quantity
                mov = InventoryMovement(
                    inventory_id=inv.id,
                    movement_type=InventoryMovementTypeEnum.ENTRY,
                    quantity=d.quantity,
                    previous_stock=prev_stock,
                    resulting_stock=inv.physical_stock,
                    reference_doc=f"ANULACION_{sale.sale_code}",
                    reason=f"Reingreso por anulación de venta: {reason}",
                    user_id=user_id
                )
                db.add(mov)

        sale.status = SaleStatusEnum.ANNULLED

        audit = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action="SALE_ANNULLED",
            entity_affected="sales",
            entity_id=sale.id,
            details=f"Anulación de venta {sale.sale_code}. Motivo: {reason}"
        )
        db.add(audit)

        db.commit()
        db.refresh(sale)
        return SaleService._build_sale_response(sale)
