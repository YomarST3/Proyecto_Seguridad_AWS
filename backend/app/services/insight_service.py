from typing import List
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.entities import Sale, SaleDetail, Product, Inventory, SaleStatusEnum, InsightSeverityEnum
from app.schemas.dashboard import InsightResponse
from app.statistics.engine import StatisticalEngine


class InsightService:
    @staticmethod
    def generate_explainable_insights(db: Session, company_id: int) -> List[InsightResponse]:
        insights: List[InsightResponse] = []
        now = datetime.utcnow()

        # 1. Análisis de Media vs. Mediana en montos de ventas confirmadas
        sales = db.query(Sale.total_amount).filter(
            Sale.company_id == company_id,
            Sale.status == SaleStatusEnum.CONFIRMED
        ).all()

        sale_amounts = [float(s[0]) for s in sales if s[0] is not None]

        if len(sale_amounts) >= 3:
            comp = StatisticalEngine.compare_mean_and_median(sale_amounts)
            diff_pct = abs(comp["relative_difference_pct"])
            
            if diff_pct >= 10.0:
                insights.append(InsightResponse(
                    id=1,
                    title="Disparidad Significativa entre Media y Mediana",
                    description=(
                        f"La media aritmética ({comp['mean']}) y la mediana ({comp['median']}) presentan una brecha de {diff_pct:.1f}%. "
                        f"Evidencia {comp['distribution_shape'].lower()} generada por transacciones de importe atípico."
                    ),
                    metric="Ticket Promedio vs. Mediana",
                    period="Histórico",
                    condition_rule="|Media - Mediana| / Mediana > 0.10",
                    evidence_value=f"Delta: {comp['difference']:.2f} ({diff_pct:.1f}%)",
                    severity=InsightSeverityEnum.WARNING if diff_pct > 20.0 else InsightSeverityEnum.INFO,
                    created_at=now
                ))

        # 2. Concentración de ventas en productos destacados
        total_revenue = sum(sale_amounts) if sale_amounts else 0.0
        if total_revenue > 0:
            top_prod = db.query(
                Product.name,
                func.sum(SaleDetail.line_total).label("prod_rev")
            ).join(
                SaleDetail, SaleDetail.product_id == Product.id
            ).join(
                Sale, Sale.id == SaleDetail.sale_id
            ).filter(
                Sale.company_id == company_id,
                Sale.status == SaleStatusEnum.CONFIRMED
            ).group_by(Product.name).order_by(func.sum(SaleDetail.line_total).desc()).first()

            if top_prod:
                share_pct = (float(top_prod.prod_rev) / total_revenue) * 100.0
                if share_pct > 30.0:
                    insights.append(InsightResponse(
                        id=2,
                        title=f"Alta Concentración en '{top_prod.name}'",
                        description=(
                            f"El producto '{top_prod.name}' representa el {share_pct:.1f}% de la facturación histórica total. "
                            "Existe una alta dependencia de catálogo en un solo ítem."
                        ),
                        metric="Participación de Ingresos",
                        period="Acumulado",
                        condition_rule="Venta_Producto / Venta_Total > 0.30",
                        evidence_value=f"${float(top_prod.prod_rev):,.2f} ({share_pct:.1f}%)",
                        severity=InsightSeverityEnum.OPPORTUNITY,
                        created_at=now
                    ))

        # 3. Alertas de inventario crítico
        low_count = db.query(func.count(Product.id)).join(
            Inventory, Inventory.product_id == Product.id
        ).filter(
            Product.company_id == company_id,
            (Inventory.physical_stock - Inventory.reserved_stock) <= Product.min_stock_alert
        ).scalar() or 0

        if low_count > 0:
            insights.append(InsightResponse(
                id=3,
                title="Riesgo de Quiebre de Stock en Catálogo",
                description=(
                    f"Se han identificado {low_count} productos cuyas existencias disponibles están en o por debajo de su umbral mínimo de seguridad. "
                    "Se requiere reabastecimiento para evitar pérdida de ventas potenciales."
                ),
                metric="Productos en Umbral Crítico",
                period="Tiempo Real",
                condition_rule="Stock_Disponible <= Min_Stock_Alert",
                evidence_value=f"{low_count} productos afectados",
                severity=InsightSeverityEnum.CRITICAL if low_count > 2 else InsightSeverityEnum.WARNING,
                created_at=now
            ))

        return insights
