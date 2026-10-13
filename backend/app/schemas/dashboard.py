from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from app.models.entities import InsightSeverityEnum


class DashboardMetricCard(BaseModel):
    title: str
    value: str
    numeric_value: float
    description: str
    trend_pct: Optional[float] = None
    trend_direction: Optional[str] = "neutral" # up, down, neutral


class RecentSaleItem(BaseModel):
    id: int
    sale_code: str
    customer_name: str
    total_amount: Decimal
    payment_status: str
    created_at: datetime


class TopSellingProduct(BaseModel):
    product_id: int
    sku: str
    product_name: str
    units_sold: int
    total_revenue: Decimal


class LowStockAlert(BaseModel):
    product_id: int
    sku: str
    product_name: str
    physical_stock: int
    min_stock_alert: int


class DashboardSummaryResponse(BaseModel):
    confirmed_sales_total: Decimal = Decimal("0.00")
    collected_cash_total: Decimal = Decimal("0.00")
    pending_orders_count: int = 0
    active_customers_count: int = 0
    active_products_count: int = 0
    low_stock_products_count: int = 0
    recent_sales: List[RecentSaleItem] = []
    top_selling_products: List[TopSellingProduct] = []
    low_stock_alerts: List[LowStockAlert] = []


class InsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    metric: str
    period: str
    condition_rule: str
    evidence_value: str
    severity: InsightSeverityEnum
    created_at: datetime

