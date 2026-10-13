import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, HTTPException, status
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.core.database import get_db
from app.models.entities import User, Sale, Product, Customer, SaleStatusEnum
from app.security.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reportes"])


@router.get("/export/csv")
def export_sales_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sales = db.query(Sale).filter(
        Sale.company_id == current_user.company_id,
        Sale.status == SaleStatusEnum.CONFIRMED
    ).order_by(Sale.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Codigo Venta", "Fecha", "Cliente", "Subtotal", "Impuesto", "Total", "Cobrado", "Estado Pago"])

    for s in sales:
        writer.writerow([
            s.sale_code,
            s.created_at.strftime("%Y-%m-%d %H:%M"),
            s.customer.full_name if s.customer else "",
            f"{s.subtotal:.2f}",
            f"{s.tax_amount:.2f}",
            f"{s.total_amount:.2f}",
            f"{s.paid_amount:.2f}",
            s.payment_status.value
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ventas_salesia.csv"}
    )


@router.get("/export/pdf")
def export_sales_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sales = db.query(Sale).filter(
        Sale.company_id == current_user.company_id,
        Sale.status == SaleStatusEnum.CONFIRMED
    ).order_by(Sale.created_at.desc()).limit(15).all()

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, "SalesIA Enterprise - Reporte Ejecutivo de Ventas")
    
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 70, f"Empresa: ID #{current_user.company_id} | Generado por: {current_user.full_name}")

    y = height - 110
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "Código")
    p.drawString(130, y, "Fecha")
    p.drawString(230, y, "Cliente")
    p.drawString(420, y, "Total (USD)")
    p.drawString(500, y, "Estado")
    p.line(50, y - 5, 560, y - 5)

    p.setFont("Helvetica", 9)
    y -= 25
    for s in sales:
        if y < 60:
            p.showPage()
            y = height - 60
        p.drawString(50, y, s.sale_code)
        p.drawString(130, y, s.created_at.strftime("%Y-%m-%d"))
        p.drawString(230, y, (s.customer.full_name[:26] if s.customer else "Cliente"))
        p.drawString(420, y, f"${s.total_amount:,.2f}")
        p.drawString(500, y, s.payment_status.value)
        y -= 20

    p.save()
    pdf_data = buffer.getvalue()
    buffer.close()

    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=reporte_ventas_salesia.pdf"}
    )
