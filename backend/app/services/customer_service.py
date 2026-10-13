from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.entities import Customer, Sale, SaleStatusEnum
from app.schemas.customers import CustomerCreate, CustomerUpdate, CustomerDetailResponse, CustomerResponse


class CustomerService:
    @staticmethod
    def list_customers(
        db: Session,
        company_id: int,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[CustomerResponse]:
        query = db.query(Customer).filter(Customer.company_id == company_id)
        if search:
            search_fmt = f"%{search.strip()}%"
            query = query.filter(
                (Customer.full_name.ilike(search_fmt)) |
                (Customer.doc_number.ilike(search_fmt)) |
                (Customer.email.ilike(search_fmt))
            )
        customers = query.order_by(Customer.full_name.asc()).offset(offset).limit(limit).all()
        return [CustomerResponse.model_validate(c) for c in customers]

    @staticmethod
    def get_customer_detail(
        db: Session,
        company_id: int,
        customer_id: int
    ) -> CustomerDetailResponse:
        customer = db.query(Customer).filter(
            Customer.id == customer_id,
            Customer.company_id == company_id
        ).first()

        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado."
            )

        # Cálculo dinámico de indicadores comerciales a partir de ventas confirmadas
        sales_stats = db.query(
            func.count(Sale.id).label("total_count"),
            func.coalesce(func.sum(Sale.total_amount), Decimal("0.00")).label("total_spent"),
            func.max(Sale.created_at).label("last_date")
        ).filter(
            Sale.customer_id == customer.id,
            Sale.company_id == company_id,
            Sale.status == SaleStatusEnum.CONFIRMED
        ).first()

        count = sales_stats.total_count if sales_stats else 0
        spent = sales_stats.total_spent if sales_stats else Decimal("0.00")
        avg_ticket = (spent / Decimal(count)) if count > 0 else Decimal("0.00")
        last_date = sales_stats.last_date if sales_stats else None

        detail = CustomerDetailResponse(
            id=customer.id,
            company_id=customer.company_id,
            customer_type=customer.customer_type,
            full_name=customer.full_name,
            doc_type=customer.doc_type,
            doc_number=customer.doc_number,
            email=customer.email,
            phone=customer.phone,
            address=customer.address,
            is_active=customer.is_active,
            created_at=customer.created_at,
            updated_at=customer.updated_at,
            total_purchases_count=count,
            total_amount_spent=round(spent, 2),
            average_ticket=round(avg_ticket, 2),
            last_purchase_date=last_date
        )
        return detail

    @staticmethod
    def create_customer(
        db: Session,
        company_id: int,
        data: CustomerCreate
    ) -> CustomerResponse:
        existing = db.query(Customer).filter(
            Customer.company_id == company_id,
            Customer.doc_number == data.doc_number
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un cliente con el documento {data.doc_number} en esta empresa."
            )

        new_cust = Customer(
            company_id=company_id,
            customer_type=data.customer_type,
            full_name=data.full_name,
            doc_type=data.doc_type,
            doc_number=data.doc_number,
            email=data.email,
            phone=data.phone,
            address=data.address,
            is_active=True
        )
        db.add(new_cust)
        db.commit()
        db.refresh(new_cust)
        return CustomerResponse.model_validate(new_cust)

    @staticmethod
    def update_customer(
        db: Session,
        company_id: int,
        customer_id: int,
        data: CustomerUpdate
    ) -> CustomerResponse:
        customer = db.query(Customer).filter(
            Customer.id == customer_id,
            Customer.company_id == company_id
        ).first()

        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado.")

        update_dict = data.model_dump(exclude_unset=True)
        for field, val in update_dict.items():
            setattr(customer, field, val)

        db.commit()
        db.refresh(customer)
        return CustomerResponse.model_validate(customer)
