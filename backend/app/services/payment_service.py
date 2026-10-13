from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.entities import Sale, Payment, PaymentMethod, AuditLog, SaleStatusEnum, PaymentStatusEnum
from app.schemas.payments import PaymentCreate, PaymentResponse, PaymentMethodResponse


class PaymentService:
    @staticmethod
    def list_payment_methods(db: Session) -> List[PaymentMethodResponse]:
        methods = db.query(PaymentMethod).filter(PaymentMethod.is_active == True).all()
        return [PaymentMethodResponse.model_validate(m) for m in methods]

    @staticmethod
    def list_sale_payments(db: Session, company_id: int, sale_id: int) -> List[PaymentResponse]:
        sale = db.query(Sale).filter(Sale.id == sale_id, Sale.company_id == company_id).first()
        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada.")

        payments = db.query(Payment).filter(Payment.sale_id == sale_id).order_by(Payment.payment_date.desc()).all()
        result = []
        for p in payments:
            result.append(PaymentResponse(
                id=p.id,
                sale_id=p.sale_id,
                sale_code=sale.sale_code,
                payment_method_name=p.payment_method.name if p.payment_method else "",
                amount=p.amount,
                reference=p.reference,
                received_by_name="Cajero / Vendedor",
                payment_date=p.payment_date,
                notes=p.notes
            ))
        return result

    @staticmethod
    def register_payment(
        db: Session,
        company_id: int,
        data: PaymentCreate,
        user_id: Optional[int] = None
    ) -> PaymentResponse:
        sale = db.query(Sale).filter(
            Sale.id == data.sale_id,
            Sale.company_id == company_id
        ).with_for_update().first()

        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada.")

        if sale.status == SaleStatusEnum.ANNULLED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pueden registrar pagos en una venta anulada.")

        pm = db.query(PaymentMethod).filter(PaymentMethod.id == data.payment_method_id).first()
        if not pm:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Método de pago no válido.")

        if pm.requires_reference and not data.reference:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El método de pago '{pm.name}' requiere un número o código de referencia obligatoriamente."
            )

        pending = sale.total_amount - sale.paid_amount
        if data.amount > pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El importe a cobrar ({data.amount}) supera el saldo pendiente de la venta ({pending})."
            )

        payment = Payment(
            sale_id=sale.id,
            payment_method_id=pm.id,
            amount=data.amount,
            reference=data.reference,
            received_by_user_id=user_id,
            payment_date=datetime.utcnow(),
            notes=data.notes
        )
        db.add(payment)

        # Actualizar acumulado cobrado y estado derivado
        sale.paid_amount += data.amount
        if sale.paid_amount >= sale.total_amount:
            sale.payment_status = PaymentStatusEnum.PAID
        elif sale.paid_amount > Decimal("0.00"):
            sale.payment_status = PaymentStatusEnum.PARTIAL
        else:
            sale.payment_status = PaymentStatusEnum.PENDING

        audit = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action="PAYMENT_RECEIVED",
            entity_affected="payments",
            entity_id=sale.id,
            details=f"Cobro de {data.amount} para venta {sale.sale_code}"
        )
        db.add(audit)

        db.commit()
        db.refresh(payment)

        return PaymentResponse(
            id=payment.id,
            sale_id=sale.id,
            sale_code=sale.sale_code,
            payment_method_name=pm.name,
            amount=payment.amount,
            reference=payment.reference,
            received_by_name="Cajero / Vendedor",
            payment_date=payment.payment_date,
            notes=payment.notes
        )
