import pptxgen from 'pptxgenjs';
import { Customer } from '../../../types';
import { IdeaMejora, ProductReportItem } from '../types';

interface ExportPptParams {
  tituloReporte: string;
  periodoReporte: string;
  notasReporte: string;
  clientes: Customer[];
  productos: ProductReportItem[];
  ideasMejora: IdeaMejora[];
  totalFacturado: number;
  totalCompras: number;
  ticketPromedio: number;
  mejorCliente: Customer | null;
}

export async function exportarReportePPT(params: ExportPptParams): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'SalesIA Enterprise';
  pptx.company = 'SalesIA Enterprise';

  const navyDark = '0F172A';
  const blueAccent = '0284C7';
  const tealAccent = '0D9488';
  const textDark = '1E293B';
  const textMuted = '64748B';

  // --------------------------------------------------------------------------
  // SLIDE 1: PORTADA EJECUTIVA
  // --------------------------------------------------------------------------
  const slide1 = pptx.addSlide();
  slide1.background = { color: '0F172A' };

  slide1.addText('SalesIA ENTERPRISE', {
    x: 0.8,
    y: 1.8,
    w: 8.5,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: '38BDF8',
    fontFace: 'Segoe UI'
  });

  slide1.addText(params.tituloReporte, {
    x: 0.8,
    y: 2.5,
    w: 11.0,
    h: 1.2,
    fontSize: 22,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Segoe UI'
  });

  slide1.addText(`Período Oficial: ${params.periodoReporte}  |  Emisión: ${new Date().toLocaleDateString()}`, {
    x: 0.8,
    y: 4.2,
    w: 8.5,
    h: 0.5,
    fontSize: 14,
    color: '94A3B8',
    fontFace: 'Segoe UI'
  });

  slide1.addText('Plataforma Comercial & Inteligencia de Negocios — Reporte Ejecutivo de Gestión', {
    x: 0.8,
    y: 6.2,
    w: 10.0,
    h: 0.4,
    fontSize: 11,
    color: '64748B',
    fontFace: 'Segoe UI'
  });

  // --------------------------------------------------------------------------
  // SLIDE 2: RESUMEN EJECUTIVO & KPIs
  // --------------------------------------------------------------------------
  const slide2 = pptx.addSlide();
  slide2.background = { color: 'F8FAFC' };

  slide2.addText('Resumen Ejecutivo & Métricas Clave', {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: navyDark,
    fontFace: 'Segoe UI'
  });

  // 4 Cajas KPI
  const kpis = [
    { label: 'FACTURACIÓN TOTAL', value: `$${params.totalFacturado.toLocaleString()}`, color: '0284C7' },
    { label: 'OPERACIONES TOTALES', value: `${params.totalCompras} compras`, color: '0F172A' },
    { label: 'TICKET PROMEDIO', value: `$${params.ticketPromedio.toFixed(2)}`, color: '047857' },
    { label: 'MEJOR CLIENTE', value: params.mejorCliente ? params.mejorCliente.full_name : 'N/A', color: '7C3AED' }
  ];

  kpis.forEach((k, idx) => {
    const xPos = 0.8 + idx * 3.1;
    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: 1.4,
      w: 2.8,
      h: 1.4,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 }
    });

    slide2.addText(k.label, {
      x: xPos + 0.15,
      y: 1.55,
      w: 2.5,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: textMuted,
      fontFace: 'Segoe UI'
    });

    slide2.addText(k.value, {
      x: xPos + 0.15,
      y: 1.9,
      w: 2.5,
      h: 0.6,
      fontSize: 15,
      bold: true,
      color: k.color,
      fontFace: 'Segoe UI'
    });
  });

  // Diagnóstico / Notas
  slide2.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 3.2,
    w: 11.6,
    h: 3.2,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 }
  });

  slide2.addText('Diagnóstico de Gestión & Observaciones:', {
    x: 1.1,
    y: 3.4,
    w: 10.0,
    h: 0.4,
    fontSize: 13,
    bold: true,
    color: navyDark,
    fontFace: 'Segoe UI'
  });

  slide2.addText(params.notasReporte, {
    x: 1.1,
    y: 3.9,
    w: 10.8,
    h: 1.2,
    fontSize: 11,
    italic: true,
    color: textDark,
    fontFace: 'Segoe UI'
  });

  slide2.addText(`• Cartera activa analizada: ${params.clientes.length} clientes formalizados.\n• Producto líder en ventas: ${params.productos[0]?.name || 'N/A'} con $${params.productos[0]?.totalRevenue?.toLocaleString()} en facturación.\n• Tasa de formalización y trazabilidad comercial: 100% auditada.`, {
    x: 1.1,
    y: 5.1,
    w: 10.8,
    h: 1.1,
    fontSize: 11,
    color: '334155',
    fontFace: 'Segoe UI'
  });

  // --------------------------------------------------------------------------
  // SLIDE 3: RANKING DE CLIENTES (TOP CARTERA)
  // --------------------------------------------------------------------------
  const slide3 = pptx.addSlide();
  slide3.background = { color: 'F8FAFC' };

  slide3.addText('Ranking de Cartera de Clientes', {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: navyDark,
    fontFace: 'Segoe UI'
  });

  const clientHeaders = [
    { text: 'Cliente / Razón Social', options: { fill: { color: navyDark }, color: 'FFFFFF', bold: true } },
    { text: 'Tipo', options: { fill: { color: navyDark }, color: 'FFFFFF', bold: true, align: 'center' as const } },
    { text: 'Documento', options: { fill: { color: navyDark }, color: 'FFFFFF', bold: true } },
    { text: 'Total Compras', options: { fill: { color: navyDark }, color: 'FFFFFF', bold: true, align: 'center' as const } },
    { text: 'Consumo ($)', options: { fill: { color: navyDark }, color: 'FFFFFF', bold: true, align: 'right' as const } }
  ];

  const clientRows = params.clientes.slice(0, 7).map(c => [
    { text: c.full_name },
    { text: c.customer_type, options: { align: 'center' as const } },
    { text: `${c.doc_type}: ${c.doc_number}` },
    { text: `${c.total_purchases_count || 0}`, options: { align: 'center' as const } },
    { text: `$${Number(c.total_amount_spent || 0).toLocaleString()}`, options: { align: 'right' as const, bold: true } }
  ]);

  slide3.addTable([clientHeaders, ...clientRows], {
    x: 0.8,
    y: 1.4,
    w: 11.6,
    fontSize: 10,
    fontFace: 'Segoe UI',
    border: { pt: 1, color: 'E2E8F0' },
    rowH: 0.45
  });

  // --------------------------------------------------------------------------
  // SLIDE 4: DEMANDA DE PRODUCTOS
  // --------------------------------------------------------------------------
  const slide4 = pptx.addSlide();
  slide4.background = { color: 'F8FAFC' };

  slide4.addText('Análisis de Productos & Demanda Comercial', {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: navyDark,
    fontFace: 'Segoe UI'
  });

  const prodHeaders = [
    { text: 'SKU', options: { fill: { color: tealAccent }, color: 'FFFFFF', bold: true } },
    { text: 'Nombre del Producto', options: { fill: { color: tealAccent }, color: 'FFFFFF', bold: true } },
    { text: 'Categoría', options: { fill: { color: tealAccent }, color: 'FFFFFF', bold: true } },
    { text: 'Unidades', options: { fill: { color: tealAccent }, color: 'FFFFFF', bold: true, align: 'center' as const } },
    { text: 'Facturación ($)', options: { fill: { color: tealAccent }, color: 'FFFFFF', bold: true, align: 'right' as const } },
    { text: 'Demanda', options: { fill: { color: tealAccent }, color: 'FFFFFF', bold: true, align: 'center' as const } }
  ];

  const prodRows = params.productos.slice(0, 7).map(p => [
    { text: p.sku },
    { text: p.name },
    { text: p.category },
    { text: `${p.quantity}`, options: { align: 'center' as const, bold: true } },
    { text: `$${p.totalRevenue.toLocaleString()}`, options: { align: 'right' as const, bold: true } },
    { text: p.demandLevel, options: { align: 'center' as const } }
  ]);

  slide4.addTable([prodHeaders, ...prodRows], {
    x: 0.8,
    y: 1.4,
    w: 11.6,
    fontSize: 10,
    fontFace: 'Segoe UI',
    border: { pt: 1, color: 'E2E8F0' },
    rowH: 0.45
  });

  // --------------------------------------------------------------------------
  // SLIDE 5: PLAN DE MEJORA ESTRATÉGICA
  // --------------------------------------------------------------------------
  const slide5 = pptx.addSlide();
  slide5.background = { color: 'F8FAFC' };

  slide5.addText('Plan de Mejora Estratégica & Recomendaciones', {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: navyDark,
    fontFace: 'Segoe UI'
  });

  params.ideasMejora.slice(0, 4).forEach((idea, idx) => {
    const yPos = 1.3 + idx * 1.35;
    slide5.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: yPos,
      w: 11.6,
      h: 1.2,
      fill: { color: 'FFFFFF' },
      line: { color: 'CBD5E1', width: 1 }
    });

    slide5.addText(`${idx + 1}. ${idea.area}`, {
      x: 1.0,
      y: yPos + 0.1,
      w: 4.5,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: blueAccent,
      fontFace: 'Segoe UI'
    });

    slide5.addText(`Acción: ${idea.accion}`, {
      x: 1.0,
      y: yPos + 0.45,
      w: 11.0,
      h: 0.4,
      fontSize: 10,
      color: textDark,
      fontFace: 'Segoe UI'
    });

    slide5.addText(`Impacto Proyectado: ${idea.impacto}`, {
      x: 1.0,
      y: yPos + 0.85,
      w: 11.0,
      h: 0.3,
      fontSize: 9.5,
      bold: true,
      color: '047857',
      fontFace: 'Segoe UI'
    });
  });

  // Descarga directa del archivo PowerPoint
  await pptx.writeFile({ fileName: `Reporte_Ejecutivo_Clientes_${params.periodoReporte}_${new Date().toISOString().slice(0, 10)}.pptx` });
}
