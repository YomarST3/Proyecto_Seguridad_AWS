from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.entities import Employee, Sale, SaleStatusEnum
from app.schemas.employees import EmployeeCreate, EmployeeResponse, EmployeePerformanceResponse


class EmployeeService:
    @staticmethod
    def list_employees(db: Session, company_id: int) -> List[EmployeeResponse]:
        emps = db.query(Employee).filter(
            Employee.company_id == company_id,
            Employee.is_active == True
        ).all()
        return [EmployeeResponse.model_validate(e) for e in emps]

    @staticmethod
    def get_employee_performance(
        db: Session,
        company_id: int,
        employee_id: int
    ) -> EmployeePerformanceResponse:
        emp = db.query(Employee).filter(
            Employee.id == employee_id,
            Employee.company_id == company_id
        ).first()

        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador no encontrado.")

        # Ventas confirmadas reales del vendedor
        stats = db.query(
            func.count(Sale.id).label("sales_count"),
            func.coalesce(func.sum(Sale.total_amount), Decimal("0.00")).label("sales_amount")
        ).filter(
            Sale.salesperson_id == emp.id,
            Sale.company_id == company_id,
            Sale.status == SaleStatusEnum.CONFIRMED
        ).first()

        count = stats.sales_count if stats else 0
        amount = stats.sales_amount if stats else Decimal("0.00")
        commission = amount * emp.commission_rate
        target_pct = (amount / emp.monthly_sales_target * Decimal("100.0")) if emp.monthly_sales_target > Decimal("0.00") else Decimal("0.00")

        return EmployeePerformanceResponse(
            id=emp.id,
            company_id=emp.company_id,
            user_id=emp.user_id,
            first_name=emp.first_name,
            last_name=emp.last_name,
            doc_number=emp.doc_number,
            email=emp.email,
            phone=emp.phone,
            job_title=emp.job_title,
            commission_rate=emp.commission_rate,
            monthly_sales_target=emp.monthly_sales_target,
            is_active=emp.is_active,
            hire_date=emp.hire_date,
            total_sales_count=count,
            total_sales_amount=round(amount, 2),
            total_commission_earned=round(commission, 2),
            target_fulfillment_pct=round(target_pct, 2)
        )
