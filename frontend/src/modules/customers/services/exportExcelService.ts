import ExcelJS from 'exceljs';
import { Customer, Sale, UsuarioEmpresarial } from '../../../types';
import { IdeaMejora, ProductReportItem } from '../types';

interface ExportExcelParams {
  tituloReporte: string;
  periodoReporte: string;
  notasReporte: string;
  clientes: Customer[];
  productos: ProductReportItem[];
  ventas: Sale[];
  ideasMejora: IdeaMejora[];
  personalRoles?: UsuarioEmpresarial[];
  incluirPersonalRoles?: boolean;
  totalFacturado: number;
  totalCompras: number;
  ticketPromedio: number;
  mejorCliente: Customer | null;
}

export async function exportarReporteExcel(params: ExportExcelParams): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SalesIA Enterprise Security & BI Engine';
  wb.created = new Date();
  wb.company = 'SalesIA Enterprise';

  const navyFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Slate-900 / Navy
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

  // ==========================================================================
  // HOJA 1: RESUMEN EJECUTIVO (DISEÑO PROFESIONAL CON METADATOS Y TARJETAS)
  // ==========================================================================
  const wsResumen = wb.addWorksheet('Resumen Ejecutivo', {
    views: [{ showGridLines: true }]
  });

  // Título Banner Principal Merged
  wsResumen.mergeCells('A1:D2');
  const titleCell = wsResumen.getCell('A1');
  titleCell.value = 'SALESIA ENTERPRISE — REPORTE EJECUTIVO DE GESTIÓN COMERCIAL';
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = navyFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Subtítulo
  wsResumen.mergeCells('A3:D3');
  const subCell = wsResumen.getCell('A3');
  subCell.value = `Período: ${params.periodoReporte}  |  Emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  |  Auditoría de Clientes, Productos y Mejora Continua`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Encabezado de Sección Métricas
  wsResumen.mergeCells('A5:D5');
  const sectionHeader = wsResumen.getCell('A5');
  sectionHeader.value = 'INDICADORES CLAVE DE RENDIMIENTO (KPIs)';
  sectionHeader.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  sectionHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }
  };
  sectionHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Tabla de KPIs
  const kpiRows = [
    ['Facturación Total Bruta', params.totalFacturado, 'Total Compras Formalizadas', params.totalCompras],
    ['Ticket Promedio General', params.ticketPromedio, 'Clientes Activos Analizados', params.clientes.length],
    ['Cliente Más Destacado (Top 1)', params.mejorCliente ? params.mejorCliente.full_name : 'N/A', 'Consumo del Mejor Cliente', params.mejorCliente ? Number(params.mejorCliente.total_amount_spent || 0) : 0],
    ['Producto Líder en Demanda', params.productos[0]?.name || 'N/A', 'Facturación Producto Líder', params.productos[0]?.totalRevenue || 0],
  ];

  kpiRows.forEach((r, idx) => {
    const rowNum = 6 + idx;
    const row = wsResumen.getRow(rowNum);
    row.values = r;

    // Columna A (Etiqueta 1)
    const cellA = wsResumen.getCell(`A${rowNum}`);
    cellA.font = boldFont;
    cellA.fill = zebraFill;
    cellA.border = thinBorder;

    // Columna B (Valor 1)
    const cellB = wsResumen.getCell(`B${rowNum}`);
    cellB.font = regularFont;
    cellB.border = thinBorder;
    if (idx === 0 || idx === 1) cellB.numFmt = '"$"#,##0.00';
    if (idx === 0 || idx === 1) cellB.font = { ...boldFont, color: { argb: 'FF0284C7' } };

    // Columna C (Etiqueta 2)
    const cellC = wsResumen.getCell(`C${rowNum}`);
    cellC.font = boldFont;
    cellC.fill = zebraFill;
    cellC.border = thinBorder;

    // Columna D (Valor 2)
    const cellD = wsResumen.getCell(`D${rowNum}`);
    cellD.font = regularFont;
    cellD.border = thinBorder;
    if (idx === 0 || idx === 1) cellD.numFmt = '#,##0';
    if (idx === 2 || idx === 3) cellD.numFmt = '"$"#,##0.00';
  });

  // Sección Notas y Observaciones
  wsResumen.mergeCells('A11:D11');
  const notesHeader = wsResumen.getCell('A11');
  notesHeader.value = 'NOTAS U OBSERVACIONES EJECUTIVAS DE ADMINISTRACIÓN';
  notesHeader.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  notesHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }
  };
  notesHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  wsResumen.mergeCells('A12:D14');
  const notesBody = wsResumen.getCell('A12');
  notesBody.value = params.notasReporte;
  notesBody.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF334155' } };
  notesBody.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  notesBody.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  notesBody.border = thinBorder;

  // Ajuste de Anchos de Columna en Resumen
  wsResumen.getColumn(1).width = 28;
  wsResumen.getColumn(2).width = 38;
  wsResumen.getColumn(3).width = 28;
  wsResumen.getColumn(4).width = 32;

  // ==========================================================================
  // HOJA 2: CARTERA DE CLIENTES (FORMATEO FINANCIERO Y ALINEACIÓN)
  // ==========================================================================
  const wsClientes = wb.addWorksheet('Cartera de Clientes', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });

  wsClientes.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Nombre / Razón Social', key: 'name', width: 34 },
    { header: 'Tipo', key: 'type', width: 14 },
    { header: 'Tipo Doc', key: 'docType', width: 10 },
    { header: 'N° Documento', key: 'docNum', width: 16 },
    { header: 'Correo Electrónico', key: 'email', width: 30 },
    { header: 'Teléfono', key: 'phone', width: 16 },
    { header: 'Total Compras', key: 'purchases', width: 14 },
    { header: 'Total Consumo ($)', key: 'spent', width: 20 },
    { header: 'Ticket Promedio ($)', key: 'avgTicket', width: 20 },
    { header: 'Nivel Cliente', key: 'level', width: 18 },
    { header: 'Estado', key: 'status', width: 12 }
  ];

  // Estilo al Header de Clientes
  const clientHeaderRow = wsClientes.getRow(1);
  clientHeaderRow.height = 26;
  clientHeaderRow.eachCell((cell) => {
    cell.fill = navyFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  params.clientes.forEach((c, idx) => {
    const totalSpent = Number(c.total_amount_spent || 0);
    const purchases = Number(c.total_purchases_count || 0);
    const avg = purchases > 0 ? totalSpent / purchases : 0;
    const level = totalSpent > 10000 ? 'VIP Corporativo' : totalSpent > 3000 ? 'Preferencial' : 'Regular';

    const row = wsClientes.addRow({
      id: c.id,
      name: c.full_name,
      type: c.customer_type,
      docType: c.doc_type,
      docNum: c.doc_number,
      email: c.email || '—',
      phone: c.phone || '—',
      purchases: purchases,
      spent: totalSpent,
      avgTicket: avg,
      level: level,
      status: c.is_active ? 'Activo' : 'Inactivo'
    });

    row.height = 20;
    const isEven = idx % 2 === 0;

    row.eachCell((cell, colNum) => {
      cell.border = thinBorder;
      cell.font = regularFont;
      if (isEven) cell.fill = zebraFill;

      // Alineaciones y Formatos
      if (colNum === 1 || colNum === 3 || colNum === 4 || colNum === 5 || colNum === 11 || colNum === 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNum === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0';
      } else if (colNum === 9 || colNum === 10) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '"$"#,##0.00';
        cell.font = boldFont;
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  // ==========================================================================
  // HOJA 3: DEMANDA DE PRODUCTOS (ANÁLISIS DE VENTAS)
  // ==========================================================================
  const wsProductos = wb.addWorksheet('Demanda Productos', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });

  wsProductos.columns = [
    { header: 'SKU', key: 'sku', width: 14 },
    { header: 'Nombre del Producto', key: 'name', width: 36 },
    { header: 'Categoría', key: 'category', width: 24 },
    { header: 'Unidades Vendidas', key: 'quantity', width: 18 },
    { header: 'Facturación Total ($)', key: 'revenue', width: 22 },
    { header: 'Precio Promedio ($)', key: 'avgPrice', width: 20 },
    { header: '% Aporte Total', key: 'pct', width: 16 },
    { header: 'Nivel Demanda', key: 'demand', width: 18 }
  ];

  const prodHeaderRow = wsProductos.getRow(1);
  prodHeaderRow.height = 26;
  prodHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' } // Teal-600
    };
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  params.productos.forEach((p, idx) => {
    const row = wsProductos.addRow({
      sku: p.sku,
      name: p.name,
      category: p.category,
      quantity: p.quantity,
      revenue: p.totalRevenue,
      avgPrice: p.avgPrice,
      pct: p.pctRevenue / 100,
      demand: p.demandLevel
    });

    row.height = 20;
    const isEven = idx % 2 === 0;

    row.eachCell((cell, colNum) => {
      cell.border = thinBorder;
      cell.font = regularFont;
      if (isEven) cell.fill = zebraFill;

      if (colNum === 1 || colNum === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNum === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0';
      } else if (colNum === 5 || colNum === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '"$"#,##0.00';
        cell.font = boldFont;
      } else if (colNum === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '0.0%';
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  // ==========================================================================
  // HOJA 4: HISTORIAL DE VENTAS
  // ==========================================================================
  const wsVentas = wb.addWorksheet('Historial Ventas', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });

  wsVentas.columns = [
    { header: 'Código Venta', key: 'code', width: 16 },
    { header: 'Cliente', key: 'customer', width: 32 },
    { header: 'Fecha', key: 'date', width: 14 },
    { header: 'Vendedor Responsable', key: 'salesperson', width: 24 },
    { header: 'Monto Total ($)', key: 'amount', width: 18 },
    { header: 'Estado de Pago', key: 'status', width: 16 }
  ];

  const ventasHeaderRow = wsVentas.getRow(1);
  ventasHeaderRow.height = 26;
  ventasHeaderRow.eachCell((cell) => {
    cell.fill = navyFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  params.ventas.forEach((v, idx) => {
    const row = wsVentas.addRow({
      code: v.sale_code,
      customer: v.customer_name,
      date: new Date(v.created_at).toLocaleDateString(),
      salesperson: v.salesperson_name || 'Vendedor General',
      amount: Number(v.total_amount),
      status: v.payment_status === 'PAID' ? 'Cobrado' : 'Pendiente'
    });

    row.height = 20;
    const isEven = idx % 2 === 0;

    row.eachCell((cell, colNum) => {
      cell.border = thinBorder;
      cell.font = regularFont;
      if (isEven) cell.fill = zebraFill;

      if (colNum === 1 || colNum === 3 || colNum === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNum === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '"$"#,##0.00';
        cell.font = boldFont;
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  // ==========================================================================
  // HOJA 5: PLAN DE MEJORA ESTRATÉGICA (IDEAS Y PROPUESTAS DE VALOR)
  // ==========================================================================
  const wsIdeas = wb.addWorksheet('Plan de Mejora', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });

  wsIdeas.columns = [
    { header: 'N°', key: 'num', width: 6 },
    { header: 'Área Estratégica', key: 'area', width: 28 },
    { header: 'Diagnóstico Comercial Observado', key: 'diag', width: 44 },
    { header: 'Acción Recomendada de Optimización', key: 'action', width: 52 },
    { header: 'Impacto Esperado en Negocio', key: 'impact', width: 42 }
  ];

  const ideasHeaderRow = wsIdeas.getRow(1);
  ideasHeaderRow.height = 26;
  ideasHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD97706' } // Amber-600
    };
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  params.ideasMejora.forEach((idea, idx) => {
    const row = wsIdeas.addRow({
      num: idx + 1,
      area: idea.area,
      diag: idea.diagnostico,
      action: idea.accion,
      impact: idea.impacto
    });

    row.height = 36; // Altura cómoda para leer las propuestas
    const isEven = idx % 2 === 0;

    row.eachCell((cell, colNum) => {
      cell.border = thinBorder;
      cell.font = regularFont;
      if (isEven) cell.fill = zebraFill;

      if (colNum === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = boldFont;
      } else if (colNum === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = boldFont;
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  // ==========================================================================
  // HOJA 6: PERSONAL Y ROLES (SI ESTÁ HABILITADO)
  // ==========================================================================
  if (params.incluirPersonalRoles && params.personalRoles && params.personalRoles.length > 0) {
    const wsPersonal = wb.addWorksheet('Personal y Roles', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
    });

    wsPersonal.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nombre Completo', key: 'name', width: 30 },
      { header: 'Correo Corporativo', key: 'email', width: 32 },
      { header: 'Roles Asignados', key: 'roles', width: 28 },
      { header: 'Teléfono Móvil', key: 'phone', width: 16 },
      { header: 'Estado', key: 'status', width: 12 }
    ];

    const personalHeaderRow = wsPersonal.getRow(1);
    personalHeaderRow.height = 26;
    personalHeaderRow.eachCell((cell) => {
      cell.fill = navyFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    params.personalRoles.forEach((u, idx) => {
      const row = wsPersonal.addRow({
        id: u.id,
        name: u.nombre_completo,
        email: u.correo_electronico,
        roles: u.roles.join(', '),
        phone: u.telefono || '—',
        status: u.activo ? 'Activo' : 'Inactivo'
      });

      row.height = 20;
      const isEven = idx % 2 === 0;

      row.eachCell((cell, colNum) => {
        cell.border = thinBorder;
        cell.font = regularFont;
        if (isEven) cell.fill = zebraFill;

        if (colNum === 1 || colNum === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });
  }

  // Generar y Descargar Archivo Excel (.xlsx) Real
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Consolidado_Clientes_SalesIA_${params.periodoReporte}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
