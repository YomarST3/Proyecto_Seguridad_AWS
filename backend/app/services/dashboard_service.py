from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.entities import (
    Sale, SaleDetail, Payment, Order, Customer, Product, Inventory,
    SaleStatusEnum, OrderStatusEnum
)
from app.schemas.dashboard import (
    DashboardSummaryResponse, RecentSaleItem, TopSellingProduct, LowStockAlert
)


class DashboardService:
    @staticmethod
    def get_summary(db: Session, company_id: int) -> DashboardSummaryResponse:
        # 1. Ventas válidas confirmadas
        confirmed_sales = db.query(
            func.coalesce(func.sum(Sale.total_amount), Decimal("0.00"))
        ).filter(
            Sale.company_id == company_id,
            Sale.status == SaleStatusEnum.CONFIRMED
        ).scalar() or Decimal("0.00")

        # 2. Ingresos cobrados efectivamente
        collected_cash = db.query(
            func.coalesce(func.sum(Payment.amount), Decimal("0.00"))
        ).join(
            Sale, Sale.id == Payment.sale_id
        ).filter(
            Sale.company_id == company_id,
            Sale.status == SaleStatusEnum.CONFIRMED
        ).scalar() or Decimal("0.00")

        # 3. Pedidos pendientes
        pending_orders = db.query(func.count(Order.id)).filter(
            Order.company_id == company_id,
            Order.status == OrderStatusEnum.PENDING
        ).scalar() or 0

        # 4. Clientes activos
        active_customers = db.query(func.count(Customer.id)).filter(
            Customer.company_id == company_id,
            Customer.is_active == True
        ).scalar() or 0

        # 5. Productos activos
        active_products = db.query(func.count(Product.id)).filter(
            Product.company_id == company_id,
            Product.is_active == True
        ).scalar() or 0

        # 6. Alertas de stock bajo
        low_stock_query = db.query(Product, Inventory).join(
            Inventory, Inventory.product_id == Product.id
        ).filter(
            Product.company_id == company_id,
            (Inventory.physical_stock - Inventory.reserved_stock) <= Product.min_stock_alert
        ).all()

        low_stock_alerts = [
            LowStockAlert(
                product_id=p.id,
                sku=p.sku,
                product_name=p.name,
                physical_stock=inv.physical_stock,
                min_stock_alert=p.min_stock_alert
            )
            for p, inv in low_stock_query
        ]

        # 7. Ventas recientes
        recent_sales_query = db.query(Sale).filter(
            Sale.company_id == company_id
        ).order_by(Sale.created_at.desc()).limit(5).all()

        recent_sales = [
            RecentSaleItem(
                id=s.id,
                sale_code=s.sale_code,
                customer_name=s.customer.full_name if s.customer else "Cliente",
                total_amount=s.total_amount,
                payment_status=s.payment_status.value,
                created_at=s.created_at
            )
            for s in recent_sales_query
        ]

        # 8. Productos más vendidos
        top_selling_query = db.query(
            Product.id,
            Product.sku,
            Product.name,
            func.coalesce(func.sum(SaleDetail.quantity), 0).label("units"),
            func.coalesce(func.sum(SaleDetail.line_total), Decimal("0.00")).label("revenue")
        ).join(
            SaleDetail, SaleDetail.product_id == Product.id
        ).join(
            Sale, Sale.id == SaleDetail.sale_id
        ).filter(
            Sale.company_id == company_id,
            Sale.status == SaleStatusEnum.CONFIRMED
        ).group_by(
            Product.id, Product.sku, Product.name
        ).order_by(
            func.sum(SaleDetail.quantity).desc()
        ).limit(5).all()

        top_selling = [
            TopSellingProduct(
                product_id=row.id,
                sku=row.sku,
                product_name=row.name,
                units_sold=row.units,
                total_revenue=row.revenue
            )
            for row in top_selling_query
        ]

        return DashboardSummaryResponse(
            confirmed_sales_total=round(confirmed_sales, 2),
            collected_cash_total=round(collected_cash, 2),
            pending_orders_count=pending_orders,
            active_customers_count=active_customers,
            active_products_count=active_products,
            low_stock_products_count=len(low_stock_alerts),
            recent_sales=recent_sales,
            top_selling_products=top_selling,
            low_stock_alerts=low_stock_alerts
        )
