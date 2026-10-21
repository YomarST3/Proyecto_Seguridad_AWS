import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileDown,
  Printer,
  Sliders,
  Eye,
  CheckCircle2,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  Award
} from 'lucide-react';
import { ExecutiveReportParams, CommercialReportRow, InventoryReportRow, SalespersonReportRow, ReportPeriod } from '../types';
import { exportarCentroReportesExcel } from '../services/exportReportsExcelService';
import { exportarCentroReportesPDF } from '../services/exportReportsPdfService';

interface ReportCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodoSeleccionado: ReportPeriod;
  kpis: {
    facturacionTotal: number;
    costoTotal: number;
    gananciaTotal: number;
    margenPromedio: number;
    cobradoTotal: number;
    pendienteTotal: number;
    valorizacionInventario: number;
    productosCriticosCount: number;
  };
  commercialRows: CommercialReportRow[];
  inventoryRows: InventoryReportRow[];
  salespersonRows: SalespersonReportRow[];
}

export const ReportCustomizerModal: React.FC<ReportCustomizerModalProps> = ({
  isOpen,
  onClose,
  periodoSeleccionado,
  kpis,
  commercialRows,
  inventoryRows,
  salespersonRows
}) => {
  const [tabModal, setTabModal] = useState<'config' | 'vistaPrevia'>('config');
  const [titulo, setTitulo] = useState('Informe Ejecutivo de Inteligencia Comercial & Rentabilidad');
  const [periodo, setPeriodo] = useState<ReportPeriod>(periodoSeleccionado);
  const [observaciones, setObservaciones] = useState(
    'Consolidado emitido para auditoría y dirección general. Incluye margen bruto de ganancia, cuentas por cobrar, alertas de stock en almacén y cuotas comerciales.'
  );

  const [incluirGerencial, setIncluirGerencial] = useState(true);
  const [incluirComercial, setIncluirComercial] = useState(true);
  const [incluirInventario, setIncluirInventario] = useState(true);
  const [incluirVendedores, setIncluirVendedores] = useState(true);

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const reportParams: ExecutiveReportParams = {
    titulo,
    periodo,
    observaciones,
    incluirGerencial,
    incluirComercial,
    incluirInventario,
    incluirVendedores,
    kpis,
    commercialRows,
    inventoryRows,
    salespersonRows
  };

  const handleDescargarExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportarCentroReportesExcel(reportParams);
    } catch (err) {
      console.error('Error al exportar Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDescargarPDF = async () => {
    setIsExportingPdf(true);
    try {
      const filename = `Reporte_Empresarial_SalesIA_${periodo}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportarCentroReportesPDF('printable-business-report', filename);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const hasPage2 = Boolean(incluirComercial && (incluirInventario || incluirVendedores));
  const totalPages = hasPage2 ? 2 : 1;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-in fade-in">
      {/* Estilos para impresión nativa sin romper filas */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-business-report, #printable-business-report * {
            visibility: visible !important;
          }
          #printable-business-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: block !important;
          }
          .pdf-page {
            page-break-after: always !important;
            break-after: page !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 36px 40px !important;
            box-sizing: border-box !important;
          }
          .pdf-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[94vh] overflow-y-auto my-auto">
        {/* Header con Acciones de Descarga */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-900 flex items-center justify-center shadow-xs">
              <FileDown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Generador de Reporte Empresarial Personalizado
              </h3>
              <p className="text-[11px] text-slate-500">
                Ajusta parámetros, notas de auditoría y descarga en Excel (.xlsx) o PDF oficial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
            {/* Descargar Excel */}
            <button
              type="button"
              onClick={handleDescargarExcel}
              disabled={isExportingExcel}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Descargar libro Excel profesional formateado (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isExportingExcel ? 'Generando...' : 'Descargar Excel'}</span>
            </button>

            {/* Descargar PDF */}
            <button
              type="button"
              onClick={handleDescargarPDF}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Descargar reporte formal en PDF A4 sin cortes"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>{isExportingPdf ? 'Descargando...' : 'Descargar PDF'}</span>
            </button>

            {/* Imprimir */}
            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Abrir diálogo de impresión física"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTabModal('config')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              tabModal === 'config'
                ? 'bg-white text-slate-900 border-2 border-slate-900 shadow-xs font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-800" />
            <span>1. Configurar Parámetros</span>
          </button>
          <button
            type="button"
            onClick={() => setTabModal('vistaPrevia')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              tabModal === 'vistaPrevia'
                ? 'bg-white text-slate-900 border-2 border-slate-900 shadow-xs font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Vista Previa en Vivo</span>
          </button>
        </div>

        {/* PESTAÑA 1: CONFIGURACIÓN */}
        {tabModal === 'config' && (
          <div className="space-y-4 text-xs">
            {/* Parámetros Básicos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Título Principal del Informe</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Frecuencia / Período</label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as ReportPeriod)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900"
                >
                  <option value="HOY">HOY (Diario)</option>
                  <option value="SEMANA">SEMANAL (Últimos 7 días)</option>
                  <option value="MES">MENSUAL (Mes en Curso)</option>
                  <option value="TRIMESTRE">TRIMESTRAL (Q3/Q4)</option>
                  <option value="ANUAL">ANUAL (Consolidado 2026)</option>
                </select>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notas u Observaciones Ejecutivas</label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 text-xs"
              />
            </div>

            {/* Módulos a Incluir */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                Secciones a Incluir en la Exportación:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-bold text-slate-900">Resumen Gerencial 360°</p>
                      <p className="text-[10px] text-slate-500">KPIs de ingresos, ganancia bruta y estado de cobros</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={incluirGerencial}
                    onChange={(e) => setIncluirGerencial(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </label>

                <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-900">Ventas & Rentabilidad</p>
                      <p className="text-[10px] text-slate-500">Costo de mercadería, ganancia bruta y margen %</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={incluirComercial}
                    onChange={(e) => setIncluirComercial(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                </label>

                <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="font-bold text-slate-900">Inventario & Almacén Crítico</p>
                      <p className="text-[10px] text-slate-500">Valorización total y semáforo de quiebre de stock</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={incluirInventario}
                    onChange={(e) => setIncluirInventario(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                </label>

                <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-bold text-slate-900">Fuerza de Ventas & Comisiones</p>
                      <p className="text-[10px] text-slate-500">Metas mensuales, % cumplimiento y comisiones</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={incluirVendedores}
                    onChange={(e) => setIncluirVendedores(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: VISTA PREVIA EN VIVO */}
        {tabModal === 'vistaPrevia' && (
          <div className="space-y-4 max-h-[62vh] overflow-y-auto p-1 text-xs">
            {/* Header Vista Previa Documento */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Documento Oficial SalesIA Enterprise</span>
                <h3 className="text-base font-bold text-white mt-0.5">{titulo}</h3>
                <p className="text-xs text-slate-300 mt-1 italic">{observaciones}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-sky-300 font-mono text-[11px] font-bold">
                  PERÍODO: {periodo}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Emisión: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* MÓDULO 1: RESUMEN GERENCIAL Y KPIS */}
            {incluirGerencial && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Módulo: Resumen Gerencial 360°</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[10px] uppercase font-semibold text-slate-500">Facturación Bruta</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">${kpis.facturacionTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <p className="text-[10px] uppercase font-semibold text-emerald-700">Utilidad Bruta</p>
                    <p className="text-base font-bold text-emerald-900 mt-0.5">${kpis.gananciaTotal.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">{kpis.margenPromedio.toFixed(1)}% margen</p>
                  </div>
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <p className="text-[10px] uppercase font-semibold text-blue-700">Cobrado en Efectivo</p>
                    <p className="text-base font-bold text-blue-900 mt-0.5">${kpis.cobradoTotal.toLocaleString()}</p>
                    <p className="text-[10px] text-blue-600 font-semibold">${kpis.pendienteTotal.toLocaleString()} pendiente</p>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="text-[10px] uppercase font-semibold text-amber-700">Valor Stock Almacén</p>
                    <p className="text-base font-bold text-amber-900 mt-0.5">${kpis.valorizacionInventario.toLocaleString()}</p>
                    <p className="text-[10px] text-amber-700 font-semibold">{kpis.productosCriticosCount} en alerta mínima</p>
                  </div>
                </div>
              </div>
            )}

            {/* MÓDULO 2: VENTAS & RENTABILIDAD */}
            {incluirComercial && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-800 text-xs flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Módulo: Ventas & Rentabilidad ({commercialRows.length} Registros)</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Muestra ordenada por facturación</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Código</th>
                        <th className="py-2 px-3">Cliente</th>
                        <th className="py-2 px-3">Vendedor</th>
                        <th className="py-2 px-3 text-right">Facturación</th>
                        <th className="py-2 px-3 text-right">Costo</th>
                        <th className="py-2 px-3 text-right">Ganancia</th>
                        <th className="py-2 px-3 text-center">Margen</th>
                        <th className="py-2 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {commercialRows.slice(0, 5).map(r => (
                        <tr key={r.id}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{r.saleCode}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{r.customerName}</td>
                          <td className="py-2 px-3 text-slate-600">{r.salespersonName}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">${r.revenue.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-500">${r.cost.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">${r.profit.toLocaleString()}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-700">{r.marginPct.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${r.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {r.paymentStatus === 'PAID' ? 'Cobrado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MÓDULO 3: INVENTARIO & ALMACÉN CRÍTICO */}
            {incluirInventario && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-800 text-xs flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>Módulo: Inventario Crítico & Almacén ({inventoryRows.length} Productos)</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold">
                    Valorización Total: ${kpis.valorizacionInventario.toLocaleString()}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-3">Categoría</th>
                        <th className="py-2 px-3 text-center">Stock Físico</th>
                        <th className="py-2 px-3 text-center">Mínimo</th>
                        <th className="py-2 px-3 text-right">Valorización</th>
                        <th className="py-2 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventoryRows.slice(0, 5).map(inv => (
                        <tr key={inv.id}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{inv.sku}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{inv.name}</td>
                          <td className="py-2 px-3 text-slate-500">{inv.category}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">{inv.physicalStock}</td>
                          <td className="py-2 px-3 text-center text-slate-500">{inv.minStockAlert}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">${inv.totalValuation.toLocaleString()}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === 'OPTIMO'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'CRITICO'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MÓDULO 4: FUERZA DE VENTAS & COMISIONES */}
            {incluirVendedores && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-800 text-xs flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    <span>Módulo: Fuerza Comercial & Comisiones ({salespersonRows.length} Asesores)</span>
                  </div>
                  <span className="text-[10px] text-purple-700 font-semibold">
                    Cálculo de Comisiones Activo
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Asesor Comercial</th>
                        <th className="py-2 px-3">Cargo</th>
                        <th className="py-2 px-3 text-right">Cuota Mensual</th>
                        <th className="py-2 px-3 text-right">Venta Lograda</th>
                        <th className="py-2 px-3 text-center">% Avance</th>
                        <th className="py-2 px-3 text-right">Comisión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salespersonRows.slice(0, 5).map(sp => (
                        <tr key={sp.id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{sp.name}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{sp.jobTitle}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">${sp.monthlyTarget.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">${sp.salesAchieved.toLocaleString()}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              sp.fulfillmentPct >= 100
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}>
                              {sp.fulfillmentPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">${sp.commissionEarned.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SELLO DE AUDITORÍA Y FIRMA */}
            {(incluirGerencial || incluirComercial || incluirInventario || incluirVendedores) && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-800">SalesIA Enterprise Security & BI Engine</p>
                  <p className="text-[10px] text-slate-500">
                    Documento certificado para auditoría y dirección general • Certificación Oficial REP-{new Date().getTime().toString().slice(-6)}
                  </p>
                </div>
                <div className="text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                  <div className="border-b border-slate-400 w-36 mb-1"></div>
                  <p className="font-bold text-slate-800 text-[10px]">Firma de Dirección General</p>
                  <p className="text-[9px] text-slate-400">Administración & Finanzas</p>
                </div>
              </div>
            )}

            {/* ESTADO VACÍO SI NINGÚN MÓDULO ESTÁ MARCADO */}
            {!incluirGerencial && !incluirComercial && !incluirInventario && !incluirVendedores && (
              <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">No has seleccionado ningún módulo</p>
                <p className="text-slate-500 text-xs">
                  Dirígete a la pestaña "1. Configurar Parámetros" y activa las secciones que deseas incluir en el reporte.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* ÁREA DE CAPTURA A4 MULTIPÁGINA (PÁGINA 1 Y PÁGINA 2 SIN CORTES)      */}
      {/* ==================================================================== */}
      <div id="printable-business-report" className="hidden">
        {/* PÁGINA 1: RESUMEN FINANCIERO Y AUDITORÍA DE VENTAS */}
        <div
          className="pdf-page"
          id="business-pdf-page-1"
          style={{
            width: '800px',
            height: '1131px',
            padding: '36px 40px',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          <div>
            {/* Membrete */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>SalesIA</span>
                  <span style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>ENTERPRISE</span>
                </div>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '3px 0 0 0', fontWeight: 500 }}>
                  Centro de Reportes & Inteligencia Comercial
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px' }}>
                <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
                  Período: <span style={{ color: '#0284c7' }}>{periodo}</span>
                </p>
                <p style={{ color: '#64748b', fontSize: '10.5px', margin: '3px 0 0 0' }}>
                  Fecha de Emisión: <strong>{new Date().toLocaleDateString()}</strong>
                </p>
              </div>
            </div>

            {/* Título y Notas */}
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                {titulo}
              </h1>
              <p style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>
                {observaciones}
              </p>
            </div>

            {/* Tarjetas KPIs Resumen (Solo si se incluye Gerencial) */}
            {incluirGerencial && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Facturación Bruta</p>
                  <p style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>${kpis.facturacionTotal.toLocaleString()}</p>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', margin: 0 }}>Utilidad Bruta</p>
                  <p style={{ fontSize: '17px', fontWeight: 900, color: '#065f46', margin: '2px 0 0 0' }}>${kpis.gananciaTotal.toLocaleString()}</p>
                  <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#047857', margin: '1px 0 0 0' }}>{kpis.margenPromedio.toFixed(1)}% margen</p>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Total Cobrado</p>
                  <p style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>${kpis.cobradoTotal.toLocaleString()}</p>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', margin: 0 }}>Saldo por Cobrar</p>
                  <p style={{ fontSize: '17px', fontWeight: 900, color: '#92400e', margin: '2px 0 0 0' }}>${kpis.pendienteTotal.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Tabla: Ventas & Rentabilidad Comercial */}
            {incluirComercial && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                    Auditoría de Ventas & Rentabilidad ({commercialRows.length} Operaciones)
                  </h3>
                  <span style={{ fontSize: '9.5px', color: '#64748b' }}>Margen calculado sobre costo de producto</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Código</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Cliente</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Vendedor</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Venta ($)</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Costo ($)</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Ganancia ($)</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center', borderRadius: '0 4px 0 0' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commercialRows.slice(0, 6).map((r, idx) => (
                      <tr key={r.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{r.saleCode}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1e293b' }}>{r.customerName}</td>
                        <td style={{ padding: '7px 10px', color: '#475569', fontSize: '10px' }}>{r.salespersonName}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>${r.revenue.toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#64748b' }}>${r.cost.toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#047857' }}>${r.profit.toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', backgroundColor: r.paymentStatus === 'PAID' ? '#ecfdf5' : '#fffbeb', color: r.paymentStatus === 'PAID' ? '#047857' : '#b45309', border: r.paymentStatus === 'PAID' ? '1px solid #a7f3d0' : '1px solid #fde68a' }}>
                            {r.paymentStatus === 'PAID' ? 'Cobrado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Si NO se necesita página 2, colocamos Inventario y Vendedores aquí en la Página 1 */}
            {!hasPage2 && incluirInventario && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                    Almacén & Estado de Stock Crítico (Valorización: ${kpis.valorizacionInventario.toLocaleString()})
                  </h3>
                  <span style={{ fontSize: '9.5px', color: '#b45309', fontWeight: 700 }}>Alerta de Reposición</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>SKU</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Producto</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center' }}>Stock Físico</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center' }}>Mínimo</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Costo Total ($)</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center', borderRadius: '0 4px 0 0' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryRows.slice(0, 5).map((inv, idx) => (
                      <tr key={inv.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{inv.sku}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1e293b' }}>{inv.name}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>{inv.physicalStock}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', color: '#64748b' }}>{inv.minStockAlert}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>${inv.totalValuation.toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', backgroundColor: inv.status === 'OPTIMO' ? '#ecfdf5' : '#fef2f2', color: inv.status === 'OPTIMO' ? '#047857' : '#b91c1c', border: inv.status === 'OPTIMO' ? '1px solid #a7f3d0' : '1px solid #fecaca' }}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!hasPage2 && incluirVendedores && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                    Fuerza Comercial: Metas y Comisiones del Mes
                  </h3>
                  <span style={{ fontSize: '9.5px', color: '#047857', fontWeight: 700 }}>Cálculo de Comisión Activo</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Vendedor</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Cuota Mensual</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Venta Lograda</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center' }}>% Avance</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Comisión ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salespersonRows.slice(0, 5).map((sp, idx) => (
                      <tr key={sp.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: '#0f172a' }}>{sp.name}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#64748b' }}>${sp.monthlyTarget.toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>${sp.salesAchieved.toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700, color: sp.fulfillmentPct >= 100 ? '#047857' : '#0284c7' }}>
                          {sp.fulfillmentPct.toFixed(1)}%
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#047857' }}>
                          ${sp.commissionEarned.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Si NO se necesita página 2, incluimos la firma aquí */}
            {!hasPage2 && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#64748b' }}>
                <div>
                  <p style={{ fontWeight: 800, color: '#0f172a', margin: 0 }}>SalesIA Enterprise Security & BI Engine</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '9px' }}>Informe de auditoría y rentabilidad comercial emitido para administración.</p>
                  <p style={{ margin: '1px 0 0 0', fontSize: '8.5px', color: '#94a3b8' }}>ID Certificación: REP-ENT-{new Date().getTime().toString().slice(-8)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1.5px solid #0f172a', width: '160px', height: '20px', marginBottom: '4px' }}></div>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '10px' }}>Firma de Dirección General</span>
                  <p style={{ margin: '1px 0 0 0', fontSize: '8.5px', color: '#64748b' }}>Administración & Finanzas</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Página 1 */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#94a3b8' }}>
            <span>SalesIA Enterprise Security & BI Engine • Confidencial</span>
            <span style={{ fontWeight: 700, color: '#64748b' }}>Página 1 de {totalPages}</span>
          </div>
        </div>

        {/* PÁGINA 2: INVENTARIO CRÍTICO, FUERZA DE VENTAS Y FIRMA (Solo si se requiere página 2) */}
        {hasPage2 && (
          <div
            className="pdf-page"
            id="business-pdf-page-2"
            style={{
              width: '800px',
              height: '1131px',
              padding: '36px 40px',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            <div>
              {/* Membrete Continuidad */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>SalesIA Enterprise</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>• Inventario & Auditoría de Fuerza Comercial</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Período: <strong style={{ color: '#0f172a' }}>{periodo}</strong> | Pág. 2 de 2
                </div>
              </div>

              {/* Tabla: Inventario Crítico y Almacén */}
              {incluirInventario && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                      Almacén & Estado de Stock Crítico (Valorización: ${kpis.valorizacionInventario.toLocaleString()})
                    </h3>
                    <span style={{ fontSize: '9.5px', color: '#b45309', fontWeight: 700 }}>Alerta de Reposición</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                        <th style={{ padding: '7px 10px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>SKU</th>
                        <th style={{ padding: '7px 10px', textAlign: 'left' }}>Producto</th>
                        <th style={{ padding: '7px 10px', textAlign: 'center' }}>Stock Físico</th>
                        <th style={{ padding: '7px 10px', textAlign: 'center' }}>Mínimo</th>
                        <th style={{ padding: '7px 10px', textAlign: 'right' }}>Costo Total ($)</th>
                        <th style={{ padding: '7px 10px', textAlign: 'center', borderRadius: '0 4px 0 0' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryRows.slice(0, 5).map((inv, idx) => (
                        <tr key={inv.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{inv.sku}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1e293b' }}>{inv.name}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>{inv.physicalStock}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'center', color: '#64748b' }}>{inv.minStockAlert}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>${inv.totalValuation.toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', backgroundColor: inv.status === 'OPTIMO' ? '#ecfdf5' : '#fef2f2', color: inv.status === 'OPTIMO' ? '#047857' : '#b91c1c', border: inv.status === 'OPTIMO' ? '1px solid #a7f3d0' : '1px solid #fecaca' }}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tabla: Fuerza de Ventas & Comisiones */}
              {incluirVendedores && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                      Fuerza Comercial: Metas y Comisiones del Mes
                    </h3>
                    <span style={{ fontSize: '9.5px', color: '#047857', fontWeight: 700 }}>Cálculo de Comisión Activo</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                        <th style={{ padding: '7px 10px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Vendedor</th>
                        <th style={{ padding: '7px 10px', textAlign: 'right' }}>Cuota Mensual</th>
                        <th style={{ padding: '7px 10px', textAlign: 'right' }}>Venta Lograda</th>
                        <th style={{ padding: '7px 10px', textAlign: 'center' }}>% Avance</th>
                        <th style={{ padding: '7px 10px', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Comisión ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salespersonRows.slice(0, 5).map((sp, idx) => (
                        <tr key={sp.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '7px 10px', fontWeight: 700, color: '#0f172a' }}>{sp.name}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#64748b' }}>${sp.monthlyTarget.toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>${sp.salesAchieved.toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700, color: sp.fulfillmentPct >= 100 ? '#047857' : '#0284c7' }}>
                            {sp.fulfillmentPct.toFixed(1)}%
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#047857' }}>
                            ${sp.commissionEarned.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sello de Auditoría y Firma */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#64748b' }}>
                <div>
                  <p style={{ fontWeight: 800, color: '#0f172a', margin: 0 }}>SalesIA Enterprise Security & BI Engine</p>
                  <p style={{ margin: '3px 0 0 0', fontSize: '9.5px' }}>Informe de auditoría y rentabilidad comercial emitido para administración.</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#94a3b8' }}>ID Certificación: REP-ENT-{new Date().getTime().toString().slice(-8)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1.5px solid #0f172a', width: '180px', height: '24px', marginBottom: '6px' }}></div>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '10.5px' }}>Firma de Dirección General</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#64748b' }}>Administración & Finanzas</p>
                </div>
              </div>
            </div>

            {/* Footer Página 2 */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#94a3b8' }}>
              <span>SalesIA Enterprise Security & BI Engine • Confidencial</span>
              <span style={{ fontWeight: 700, color: '#64748b' }}>Página 2 de 2</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
