import ExcelJS from 'exceljs';
import { ExecutiveReportParams } from '../types';

export async function exportarCentroReportesExcel(params: ExecutiveReportParams): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SalesIA Enterprise Security & BI Engine';
  wb.created = new Date();
  wb.company = 'SalesIA Enterprise';

  const navyFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };

  const regularFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    color: { argb: 'FF1E293B' }
  };

  const boldFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 10,
    bold: true,
    color: { argb: 'FF0F172A' }
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  const zebraFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' }
  };

  // --------------------------------------------------------------------------
  // HOJA 1: RESUMEN GERENCIAL (360°)
  // --------------------------------------------------------------------------
  if (params.incluirGerencial) {
    const ws1 = wb.addWorksheet('Resumen Gerencial');
    ws1.views = [{ showGridLines: true }];

    // Banner
    ws1.mergeCells('A1:B1');
    ws1.getCell('A1').value = 'SALESIA ENTERPRISE — CENTRO DE REPORTES EJECUTIVOS';
    ws1.getCell('A1').font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    ws1.getCell('A1').fill = navyFill;
    ws1.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws1.getRow(1).height = 30;

    ws1.mergeCells('A2:B2');
    ws1.getCell('A2').value = params.titulo.toUpperCase();
    ws1.getCell('A2').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0284C7' } };
    ws1.getRow(2).height = 20;

    ws1.addRow([]);

    const kpiRows = [
      ['INDICADOR FINANCIERO / COMERCIAL', 'VALOR CONSOLIDADO'],
      ['Período Evaluado', params.periodo],
      ['Fecha y Hora de Emisión', `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
      ['Facturación Total Bruta ($)', params.kpis.facturacionTotal],
      ['Costo Total de Mercadería ($)', params.kpis.costoTotal],
      ['Utilidad Bruta Estimada ($)', params.kpis.gananciaTotal],
      ['Margen de Ganancia Promedio', params.kpis.margenPromedio / 100],
      ['Total Cobrado en Efectivo / Banco ($)', params.kpis.cobradoTotal],
      ['Saldo Pendiente de Cobro ($)', params.kpis.pendienteTotal],
      ['Valorización de Stock en Almacén ($)', params.kpis.valorizacionInventario],
      ['Productos en Stock Crítico / Alerta', params.kpis.productosCriticosCount]
    ];

    kpiRows.forEach((r, idx) => {
      const row = ws1.addRow(r);
      row.height = 22;
      if (idx === 0) {
        row.eachCell(cell => {
          cell.font = headerFont;
          cell.fill = navyFill;
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      } else {
        const c1 = row.getCell(1);
        const c2 = row.getCell(2);
        c1.font = regularFont;
        c1.border = thinBorder;
        c2.font = boldFont;
        c2.border = thinBorder;

        // Formatos
        if (typeof r[1] === 'number') {
          if (idx === 6) {
            c2.numFmt = '0.0%';
          } else if (idx === 10) {
            c2.numFmt = '#,##0';
          } else {
            c2.numFmt = '"$"#,##0.00';
          }
        }
      }
    });

    ws1.addRow([]);
    const rowNoteHead = ws1.addRow(['OBSERVACIONES Y NOTAS DE AUDITORÍA']);
    rowNoteHead.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    const rowNote = ws1.addRow([params.observaciones]);
    rowNote.getCell(1).font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF475569' } };

    ws1.columns = [{ width: 42 }, { width: 35 }];
  }

  // --------------------------------------------------------------------------
  // HOJA 2: VENTAS & RENTABILIDAD
  // --------------------------------------------------------------------------
  if (params.incluirComercial) {
    const ws2 = wb.addWorksheet('Ventas y Rentabilidad');
    ws2.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];

    ws2.columns = [
      { header: 'Código Venta', key: 'code', width: 16 },
      { header: 'Cliente / Razón Social', key: 'customer', width: 32 },
      { header: 'Vendedor Asignado', key: 'salesperson', width: 24 },
      { header: 'Fecha', key: 'date', width: 14 },
      { header: 'Facturación ($)', key: 'revenue', width: 18 },
      { header: 'Costo ($)', key: 'cost', width: 16 },
      { header: 'Utilidad Bruta ($)', key: 'profit', width: 18 },
      { header: 'Margen (%)', key: 'margin', width: 14 },
      { header: 'Estado Pago', key: 'status', width: 14 },
      { header: 'Ítems', key: 'items', width: 10 }
    ];

    ws2.getRow(1).height = 24;
    ws2.getRow(1).eachCell(cell => {
      cell.font = headerFont;
      cell.fill = navyFill;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    params.commercialRows.forEach((r, idx) => {
      const row = ws2.addRow({
        code: r.saleCode,
        customer: r.customerName,
        salesperson: r.salespersonName,
        date: new Date(r.date).toLocaleDateString(),
        revenue: r.revenue,
        cost: r.cost,
        profit: r.profit,
        margin: r.marginPct / 100,
        status: r.paymentStatus === 'PAID' ? 'Cobrado' : 'Pendiente',
        items: r.itemsCount
      });

      row.height = 20;
      const isEven = idx % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = regularFont;
        cell.border = thinBorder;
        if (isEven) cell.fill = zebraFill;

        if (colNumber === 5 || colNumber === 6 || colNumber === 7) {
          cell.numFmt = '"$"#,##0.00';
          cell.alignment = { horizontal: 'right' };
          if (colNumber === 7) cell.font = boldFont;
        } else if (colNumber === 8) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 1 || colNumber === 4 || colNumber === 9 || colNumber === 10) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    ws2.autoFilter = 'A1:J1';
  }

  // --------------------------------------------------------------------------
  // HOJA 3: INVENTARIO & ALMACÉN CRÍTICO
  // --------------------------------------------------------------------------
  if (params.incluirInventario) {
    const ws3 = wb.addWorksheet('Inventario Crítico');
    ws3.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];

    ws3.columns = [
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Nombre del Producto', key: 'name', width: 36 },
      { header: 'Categoría', key: 'category', width: 24 },
      { header: 'Stock Físico', key: 'physical', width: 14 },
      { header: 'Disponible', key: 'available', width: 14 },
      { header: 'Alerta Mínima', key: 'min', width: 14 },
      { header: 'Costo Unitario ($)', key: 'cost', width: 18 },
      { header: 'Precio Venta ($)', key: 'sale', width: 18 },
      { header: 'Valorización Total ($)', key: 'val', width: 22 },
      { header: 'Estado Stock', key: 'status', width: 16 }
    ];

    ws3.getRow(1).height = 24;
    ws3.getRow(1).eachCell(cell => {
      cell.font = headerFont;
      cell.fill = navyFill;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    params.inventoryRows.forEach((r, idx) => {
      const row = ws3.addRow({
        sku: r.sku,
        name: r.name,
        category: r.category,
        physical: r.physicalStock,
        available: r.availableStock,
        min: r.minStockAlert,
        cost: r.costPrice,
        sale: r.salePrice,
        val: r.totalValuation,
        status: r.status
      });

      row.height = 20;
      const isEven = idx % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = regularFont;
        cell.border = thinBorder;
        if (isEven) cell.fill = zebraFill;

        if (colNumber === 4 || colNumber === 5 || colNumber === 6) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if (colNumber === 7 || colNumber === 8 || colNumber === 9) {
          cell.numFmt = '"$"#,##0.00';
          cell.alignment = { horizontal: 'right' };
          if (colNumber === 9) cell.font = boldFont;
        } else if (colNumber === 1 || colNumber === 10) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    ws3.autoFilter = 'A1:J1';
  }

  // --------------------------------------------------------------------------
  // HOJA 4: FUERZA DE VENTAS & COMISIONES
  // --------------------------------------------------------------------------
  if (params.incluirVendedores) {
    const ws4 = wb.addWorksheet('Fuerza de Ventas');
    ws4.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];

    ws4.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Colaborador / Vendedor', key: 'name', width: 28 },
      { header: 'Cargo / Especialidad', key: 'role', width: 24 },
      { header: 'Cuota Mensual ($)', key: 'target', width: 18 },
      { header: 'Ventas Logradas ($)', key: 'sales', width: 20 },
      { header: '% Cumplimiento', key: 'pct', width: 16 },
      { header: 'Tasa Comisión', key: 'rate', width: 14 },
      { header: 'Comisión Ganada ($)', key: 'earned', width: 20 },
      { header: 'Órdenes Cerradas', key: 'count', width: 16 }
    ];

    ws4.getRow(1).height = 24;
    ws4.getRow(1).eachCell(cell => {
      cell.font = headerFont;
      cell.fill = navyFill;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    params.salespersonRows.forEach((r, idx) => {
      const row = ws4.addRow({
        id: r.id,
        name: r.name,
        role: r.jobTitle,
        target: r.monthlyTarget,
        sales: r.salesAchieved,
        pct: r.fulfillmentPct / 100,
        rate: r.commissionRate,
        earned: r.commissionEarned,
        count: r.salesCount
      });

      row.height = 20;
      const isEven = idx % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = regularFont;
        cell.border = thinBorder;
        if (isEven) cell.fill = zebraFill;

        if (colNumber === 4 || colNumber === 5 || colNumber === 8) {
          cell.numFmt = '"$"#,##0.00';
          cell.alignment = { horizontal: 'right' };
          if (colNumber === 8) cell.font = boldFont;
        } else if (colNumber === 6 || colNumber === 7) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 1 || colNumber === 9) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    ws4.autoFilter = 'A1:I1';
  }

  // Generar buffer y descargar archivo
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Reporte_Ejecutivo_Empresarial_SalesIA_${params.periodo}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
