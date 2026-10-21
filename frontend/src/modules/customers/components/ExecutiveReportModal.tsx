import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  FileDown,
  FileSpreadsheet,
  Printer,
  Sliders,
  Eye,
  CheckCircle2,
  TrendingUp,
  Building2,
  Package,
  Lightbulb,
  Sparkles,
  Layers,
  ArrowRight,
  X,
  Presentation
} from 'lucide-react';
import { Customer, Sale, UsuarioEmpresarial } from '../../../types';
import { IdeaMejora, ProductReportItem, DEFAULT_IDEAS_MEJORA } from '../types';
import { exportarReporteExcel } from '../services/exportExcelService';
import { exportarReportePDF } from '../services/exportPdfService';
import { exportarReportePPT } from '../services/exportPptService';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  allSales: Sale[];
  systemUsers: UsuarioEmpresarial[];
  rankingReporte: Customer[];
  mejorCliente: Customer | null;
  totalFacturadoReporte: number;
  totalComprasReporte: number;
  ticketPromedioReporte: number;
  chartDataRankingReporte: any[];
  chartDataDistribucionReporte: any[];
  productosParaReporte: ProductReportItem[];
  ventasParaReporte: Sale[];
  clientesExcluidos: number[];
  toggleClienteExcluido: (id: number) => void;
  seleccionarTodosClientes: () => void;
  deseleccionarTodosClientes: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  customers,
  systemUsers,
  rankingReporte,
  mejorCliente,
  totalFacturadoReporte,
  totalComprasReporte,
  ticketPromedioReporte,
  chartDataRankingReporte,
  chartDataDistribucionReporte,
  productosParaReporte,
  ventasParaReporte,
  clientesExcluidos,
  toggleClienteExcluido,
  seleccionarTodosClientes,
  deseleccionarTodosClientes
}) => {
  const [tabReporteModal, setTabReporteModal] = useState<'config' | 'vistaPrevia'>('config');
  const [periodoReporte, setPeriodoReporte] = useState<'MENSUAL' | 'QUINCENAL' | 'ANUAL'>('MENSUAL');
  const [tituloReporte, setTituloReporte] = useState('Reporte Ejecutivo de Cartera de Clientes & Compras');
  const [notasReporte, setNotasReporte] = useState(
    'Consolidado comercial emitido para la dirección general y administración. Auditoría de facturación, clientes destacados y comportamiento de consumo.'
  );

  const [incluirGraficoRanking, setIncluirGraficoRanking] = useState(true);
  const [incluirGraficoDistribucion, setIncluirGraficoDistribucion] = useState(true);
  const [incluirTablaClientes, setIncluirTablaClientes] = useState(true);
  const [incluirHistorialVentas, setIncluirHistorialVentas] = useState(true);
  const [incluirPersonalRoles, setIncluirPersonalRoles] = useState(false);
  const [incluirAnalisisProductos, setIncluirAnalisisProductos] = useState(true);
  const [incluirIdeasMejora, setIncluirIdeasMejora] = useState(true);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);

  // Ideas y recomendaciones estratégicas de mejora comercial (editables por el usuario)
  const [ideasMejora, setIdeasMejora] = useState<IdeaMejora[]>(DEFAULT_IDEAS_MEJORA);

  if (!isOpen) return null;

  const clientesParaReporte = customers.filter(c => !clientesExcluidos.includes(c.id));

  // 1. Descarga directa a Excel con formato corporativo profesional
  const handleDescargarExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportarReporteExcel({
        tituloReporte,
        periodoReporte,
        notasReporte,
        clientes: clientesParaReporte,
        productos: productosParaReporte,
        ventas: ventasParaReporte,
        ideasMejora,
        personalRoles: systemUsers,
        incluirPersonalRoles,
        totalFacturado: totalFacturadoReporte,
        totalCompras: totalComprasReporte,
        ticketPromedio: ticketPromedioReporte,
        mejorCliente
      });
    } catch (err) {
      console.error('Error al generar Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // 2. Descarga directa de archivo PDF (sin abrir ventana de impresión)
  const handleDescargarPDF = async () => {
    setIsExportingPdf(true);
    try {
      const filename = `Reporte_Ejecutivo_Clientes_${periodoReporte}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportarReportePDF('printable-report-area', filename);
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 3. Descarga directa de presentación PowerPoint (.pptx)
  const handleDescargarPPT = async () => {
    setIsExportingPpt(true);
    try {
      await exportarReportePPT({
        tituloReporte,
        periodoReporte,
        notasReporte,
        clientes: clientesParaReporte,
        productos: productosParaReporte,
        ideasMejora,
        totalFacturado: totalFacturadoReporte,
        totalCompras: totalComprasReporte,
        ticketPromedio: ticketPromedioReporte,
        mejorCliente
      });
    } catch (err) {
      console.error('Error al generar PPT:', err);
    } finally {
      setIsExportingPpt(false);
    }
  };

  // 4. Imprimir directamente a papel o impresora
  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-in fade-in">
      {/* Estilos para impresión nativa sin romper filas */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible !important;
          }
          #printable-report-area {
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
        
        {/* Header del Modal con Botones Separados */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-900 flex items-center justify-center shadow-xs">
              <FileDown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Generador & Editor de Reporte Ejecutivo
              </h3>
              <p className="text-[11px] text-slate-500">
                Personaliza los clientes, gráficos y exporta directamente en Excel, PDF o PowerPoint
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

            {/* Descargar PDF Directo */}
            <button
              type="button"
              onClick={handleDescargarPDF}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Descargar directamente archivo PDF a tu equipo"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>{isExportingPdf ? 'Descargando...' : 'Descargar PDF'}</span>
            </button>

            {/* Descargar PPT Directo */}
            <button
              type="button"
              onClick={handleDescargarPPT}
              disabled={isExportingPpt}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Descargar presentación ejecutiva en PowerPoint (.pptx)"
            >
              <Presentation className="w-3.5 h-3.5 text-amber-600" />
              <span>{isExportingPpt ? 'Generando...' : 'Descargar PPT'}</span>
            </button>

            {/* Imprimir Físicamente */}
            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Imprimir reporte en hoja de papel o impresora"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de Pestaña del Modal: Configurar vs Vista Previa */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTabReporteModal('config')}
            className={`w-1/2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tabReporteModal === 'config'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Personalizar & Editar Contenido</span>
          </button>

          <button
            type="button"
            onClick={() => setTabReporteModal('vistaPrevia')}
            className={`w-1/2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tabReporteModal === 'vistaPrevia'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Vista Previa del Documento ({clientesParaReporte.length} Clientes)</span>
          </button>
        </div>

        {/* PESTAÑA: CONFIGURACIÓN Y EDICIÓN DEL REPORTE */}
        {tabReporteModal === 'config' && (
          <div className="space-y-4 text-xs">
            {/* Parámetros del Reporte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Título del Reporte</label>
                <input
                  type="text"
                  value={tituloReporte}
                  onChange={(e) => setTituloReporte(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Frecuencia / Período del Informe</label>
                <select
                  value={periodoReporte}
                  onChange={(e: any) => setPeriodoReporte(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="MENSUAL">Reporte Mensual (Octubre 2026)</option>
                  <option value="QUINCENAL">Reporte Quincenal (1ra Quincena Octubre 2026)</option>
                  <option value="ANUAL">Reporte Acumulado Anual 2026</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Notas u Observaciones Ejecutivas</label>
                <textarea
                  rows={2}
                  value={notasReporte}
                  onChange={(e) => setNotasReporte(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Secciones y Gráficos a Incluir (Editables) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Secciones, Gráficos y Módulos a Incluir en el Informe:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirGraficoRanking}
                    onChange={(e) => setIncluirGraficoRanking(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] font-medium text-slate-800">Ranking de Clientes (Top Compras)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirGraficoDistribucion}
                    onChange={(e) => setIncluirGraficoDistribucion(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] font-medium text-slate-800">Distribución Jurídica vs Natural</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirTablaClientes}
                    onChange={(e) => setIncluirTablaClientes(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] font-medium text-slate-800">Tabla de Cartera de Clientes</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirAnalisisProductos}
                    onChange={(e) => setIncluirAnalisisProductos(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] font-medium text-slate-800">Análisis de Productos & Demanda</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirHistorialVentas}
                    onChange={(e) => setIncluirHistorialVentas(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] font-medium text-slate-800">Historial Reciente de Facturación</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirIdeasMejora}
                    onChange={(e) => setIncluirIdeasMejora(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] font-medium text-slate-800">Plan de Mejora Estratégica & Ideas</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer sm:col-span-2 lg:col-span-3">
                  <input
                    type="checkbox"
                    checked={incluirPersonalRoles}
                    onChange={(e) => setIncluirPersonalRoles(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] font-medium text-slate-800">
                    Incluir sección de Usuarios & Personal Interno con Roles ({systemUsers.length} colaboradores)
                  </span>
                </label>
              </div>
            </div>

            {/* Selección y Exclusión de Clientes para el Reporte */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Clientes que se incluirán en el Reporte ({clientesParaReporte.length} de {customers.length})
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Desmarca cualquier cliente que desees excluir del reporte:
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={seleccionarTodosClientes}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    Marcar todos
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={deseleccionarTodosClientes}
                    className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    Desmarcar todos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1 pt-1">
                {customers.map((c) => {
                  const incluido = !clientesExcluidos.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleClienteExcluido(c.id)}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        incluido
                          ? 'bg-white border-blue-200 shadow-2xs'
                          : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate text-[11px]">{c.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          ${Number(c.total_amount_spent || 0).toLocaleString()} • {c.total_purchases_count || 0} compras
                        </p>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        incluido ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {incluido && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editor Interactivo de Ideas de Mejora & Recomendaciones */}
            {incluirIdeasMejora && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    Plan de Mejora Estratégica & Recomendaciones Comerciales (Editables):
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Puedes personalizar la acción recomendada de cada área
                  </span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {ideasMejora.map((idea, idx) => (
                    <div key={idea.id} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold">
                            {idx + 1}
                          </span>
                          {idea.area}
                        </span>
                        <span className="text-[10px] text-slate-400 italic font-mono">{idea.diagnostico}</span>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={idea.accion}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIdeasMejora(prev => prev.map(item => item.id === idea.id ? { ...item, accion: val } : item));
                          }}
                          className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Escribe la recomendación o acción estratégica..."
                        />
                      </div>
                      <div className="text-[10px] text-emerald-700 flex items-center gap-1">
                        <strong>Impacto proyectado:</strong> {idea.impacto}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTabReporteModal('vistaPrevia')}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver Vista Previa del Documento</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA: VISTA PREVIA DEL DOCUMENTO PDF */}
        {tabReporteModal === 'vistaPrevia' && (
          <div className="space-y-4">
            {/* Barra de Acciones Separadas en Vista Previa */}
            <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  Vista previa del documento oficial <strong>SalesIA Enterprise</strong> ({clientesParaReporte.length} clientes incluidos).
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDescargarExcel}
                  disabled={isExportingExcel}
                  className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Descargar datos en libro Excel con diseño profesional"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{isExportingExcel ? 'Generando...' : 'Descargar Excel'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDescargarPDF}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Descargar directamente archivo PDF a tu disco local"
                >
                  <FileDown className="w-3.5 h-3.5 text-sky-200" />
                  <span>{isExportingPdf ? 'Descargando...' : 'Descargar PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDescargarPPT}
                  disabled={isExportingPpt}
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Descargar presentación en PowerPoint (.pptx)"
                >
                  <Presentation className="w-3.5 h-3.5 text-amber-200" />
                  <span>{isExportingPpt ? 'Generando...' : 'Descargar PPT'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleImprimir}
                  className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Imprimir documento oficial"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>

            {/* Hoja Documento Preview */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 max-h-[64vh] overflow-y-auto font-sans">
              
              {/* Membrete del Reporte */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-950 tracking-tight text-lg">SalesIA</span>
                    <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">Enterprise</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">Plataforma Comercial & Inteligencia de Negocios</p>
                </div>

                <div className="text-right text-xs">
                  <p className="font-bold text-slate-900">Período: {periodoReporte}</p>
                  <p className="text-slate-400 text-[11px]">Emisión: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Título y Resumen Ejecutivo */}
              <div>
                <h2 className="text-base font-bold text-slate-950">{tituloReporte}</h2>
                <p className="text-xs text-slate-600 mt-1 italic leading-relaxed">{notasReporte}</p>
              </div>

              {/* Contexto y Diagnóstico Analítico Extenso */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  Diagnóstico Comercial & Contexto de Cartera
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-600 pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block text-xs">Concentración de Cartera</span>
                    <p className="text-slate-500 mt-0.5">
                      El cliente principal ({mejorCliente?.full_name || 'N/A'}) representa el{' '}
                      <strong className="text-blue-700">
                        {totalFacturadoReporte > 0 && mejorCliente
                          ? ((Number(mejorCliente.total_amount_spent || 0) / totalFacturadoReporte) * 100).toFixed(1)
                          : 0}%
                      </strong>{' '}
                      de la facturación total analizada.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block text-xs">Cobertura de Productos</span>
                    <p className="text-slate-500 mt-0.5">
                      Se han suministrado <strong className="text-emerald-700">{productosParaReporte.length} referencias activas</strong>, con un producto líder ({productosParaReporte[0]?.name || 'N/A'}) que acumula ${Number(productosParaReporte[0]?.totalRevenue || 0).toLocaleString()}.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block text-xs">Frecuencia & Ticket</span>
                    <p className="text-slate-500 mt-0.5">
                      Promedio de <strong className="text-indigo-700">
                        {clientesParaReporte.length > 0 ? (totalComprasReporte / clientesParaReporte.length).toFixed(1) : 0} compras por cliente
                      </strong>, con un ticket medio de ${ticketPromedioReporte.toFixed(2)} por operación.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 KPIs del Reporte */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Facturación Total</p>
                  <p className="text-base font-bold text-slate-950 mt-0.5">${totalFacturadoReporte.toLocaleString()}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Total Operaciones</p>
                  <p className="text-base font-bold text-slate-950 mt-0.5">{totalComprasReporte} compras</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Ticket Promedio</p>
                  <p className="text-base font-bold text-slate-950 mt-0.5">${ticketPromedioReporte.toFixed(2)}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Mejor Cliente</p>
                  <p className="text-xs font-bold text-blue-900 mt-1 truncate">
                    {mejorCliente ? mejorCliente.full_name : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Gráficos en el Reporte */}
              {(incluirGraficoRanking || incluirGraficoDistribucion) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {incluirGraficoRanking && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        Ranking: Clientes que Más Compran ($)
                      </p>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataRankingReporte} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => `$${v/1000}k`} />
                            <Bar dataKey="monto" fill="#0284c7" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {incluirGraficoDistribucion && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-600" />
                        Distribución por Tipo de Cliente
                      </p>
                      <div className="h-44 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataDistribucionReporte} layout="vertical" margin={{ top: 10, right: 20, left: 25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} />
                            <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]}>
                              {chartDataDistribucionReporte.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sección: Análisis Detallado de Productos & Demanda Comercial */}
              {incluirAnalisisProductos && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-teal-600" />
                        Análisis Detallado de Productos Vendidos & Demanda Comercial
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Volumen de unidades suministradas, facturación generada y categorización de demanda
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-bold">
                      {productosParaReporte.length} Artículos
                    </span>
                  </div>

                  {/* Mini KPIs de Productos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Producto Estrella</span>
                      <span className="font-bold text-slate-900 truncate block text-[11px]">
                        {productosParaReporte[0]?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Unidades del Líder</span>
                      <span className="font-bold text-slate-900 block text-[11px]">
                        {productosParaReporte[0]?.quantity || 0} unidades
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Facturación Líder</span>
                      <span className="font-bold text-teal-700 block text-[11px]">
                        ${Number(productosParaReporte[0]?.totalRevenue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Aporte del Líder</span>
                      <span className="font-bold text-blue-700 block text-[11px]">
                        {productosParaReporte[0]?.pctRevenue ? productosParaReporte[0].pctRevenue.toFixed(1) : 0}% del Total
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Productos */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px] min-w-[650px]">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Nombre del Producto</th>
                          <th className="py-2.5 px-3">Categoría</th>
                          <th className="py-2.5 px-3 text-center">Unidades</th>
                          <th className="py-2.5 px-3 font-mono text-right">Facturación ($)</th>
                          <th className="py-2.5 px-3 font-mono text-right">Precio Promedio</th>
                          <th className="py-2.5 px-3 text-center">% Aporte</th>
                          <th className="py-2.5 px-3 text-center">Nivel Demanda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {productosParaReporte.map((p) => (
                          <tr key={p.sku} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.sku}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                            <td className="py-2 px-3 text-slate-600">{p.category}</td>
                            <td className="py-2 px-3 text-center font-bold text-blue-700">{p.quantity}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 text-right">${p.totalRevenue.toLocaleString()}</td>
                            <td className="py-2 px-3 font-mono text-slate-600 text-right">${p.avgPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700">{p.pctRevenue.toFixed(1)}%</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                p.demandLevel === 'Alta Rotación'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : p.demandLevel === 'Estratégico'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {p.demandLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabla de Clientes en el Reporte */}
              {incluirTablaClientes && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Detalle de Cartera de Clientes Seleccionados ({clientesParaReporte.length})
                  </p>
                  <table className="w-full text-left text-[11px] border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Cliente</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3">Documento</th>
                        <th className="py-2 px-3">Contacto</th>
                        <th className="py-2 px-3 font-mono">Consumo Total</th>
                        <th className="py-2 px-3 text-center">Compras</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientesParaReporte.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{c.full_name}</td>
                          <td className="py-2 px-3 text-slate-600">{c.customer_type}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{c.doc_type}: {c.doc_number}</td>
                          <td className="py-2 px-3 text-slate-600">{c.email || c.phone}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">${Number(c.total_amount_spent || 0).toLocaleString()}</td>
                          <td className="py-2 px-3 text-center">{c.total_purchases_count || 0} ops.</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Historial de Compras en el Reporte */}
              {incluirHistorialVentas && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Historial Reciente de Facturación & Operaciones
                  </p>
                  <table className="w-full text-left text-[11px] border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Código</th>
                        <th className="py-2 px-3">Cliente</th>
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3">Vendedor</th>
                        <th className="py-2 px-3">Monto</th>
                        <th className="py-2 px-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ventasParaReporte.map((v) => (
                        <tr key={v.id}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{v.sale_code}</td>
                          <td className="py-2 px-3 text-slate-800">{v.customer_name}</td>
                          <td className="py-2 px-3 text-slate-500">{new Date(v.created_at).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-slate-600">{v.salesperson_name}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">${Number(v.total_amount).toLocaleString()}</td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-emerald-700">
                              {v.payment_status === 'PAID' ? 'Cobrado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sección: Plan de Mejora Estratégica & Recomendaciones Comerciales */}
              {incluirIdeasMejora && (
                <div className="space-y-3 pt-2">
                  <div className="border-t border-slate-200 pt-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      Plan de Mejora Estratégica & Ideas de Optimización Comercial
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Propuestas accionables basadas en los hábitos de consumo y la demanda de la cartera
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ideasMejora.map((idea, idx) => (
                      <div key={idea.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{idea.area}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">
                          <strong>Diagnóstico:</strong> {idea.diagnostico}
                        </p>
                        <p className="text-[11px] text-slate-800 font-medium">
                          <strong>Acción:</strong> {idea.accion}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-semibold pt-0.5">
                          ✓ {idea.impacto}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sección de Personal con Roles en el Reporte si está seleccionado */}
              {incluirPersonalRoles && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Personal Interno & Colaboradores con Roles Asignados
                  </p>
                  <table className="w-full text-left text-[11px] border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Colaborador</th>
                        <th className="py-2 px-3">Correo</th>
                        <th className="py-2 px-3">Roles</th>
                        <th className="py-2 px-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {systemUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{u.nombre_completo}</td>
                          <td className="py-2 px-3 text-slate-600">{u.correo_electronico}</td>
                          <td className="py-2 px-3">{u.roles.join(', ')}</td>
                          <td className="py-2 px-3 text-slate-700">{u.activo ? 'Activo' : 'Inactivo'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pie de Firma del Reporte */}
              <div className="pt-8 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                <div>
                  <p className="font-semibold text-slate-600">SalesIA Enterprise Security & BI Engine</p>
                  <p>Reporte oficial generado con trazabilidad criptográfica y auditoría de datos</p>
                </div>
                <div className="text-right">
                  <p className="border-t border-slate-300 pt-1 w-44 font-semibold text-slate-700 text-center">Firma de Administración</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ÁREA DE IMPRESIÓN Y CAPTURA MULTIPÁGINA A4 PERFECTAMENTE ESTRUCTURADA */}
      <div id="printable-report-area" className="hidden">
        {/* ========================================== */}
        {/* PÁGINA 1: RESUMEN EJECUTIVO, CARTERA & PRODUCTOS */}
        {/* ========================================== */}
        <div
          className="pdf-page"
          id="pdf-page-1"
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
            {/* Membrete del Reporte */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>SalesIA</span>
                  <span style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>ENTERPRISE</span>
                </div>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '3px 0 0 0', fontWeight: 500 }}>
                  Plataforma Comercial & Inteligencia de Negocios
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px' }}>
                <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Período: <span style={{ color: '#0284c7' }}>{periodoReporte}</span>
                </p>
                <p style={{ color: '#64748b', fontSize: '10.5px', margin: '3px 0 0 0' }}>
                  Fecha de Emisión: <strong>{new Date().toLocaleDateString()}</strong>
                </p>
              </div>
            </div>

            {/* Título y Notas Ejecutivas */}
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
                {tituloReporte}
              </h1>
              <p style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>
                {notasReporte}
              </p>
            </div>

            {/* Tarjetas KPIs Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
              <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Facturación Bruta</p>
                <p style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0', letterSpacing: '-0.5px' }}>${totalFacturadoReporte.toLocaleString()}</p>
              </div>
              <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Operaciones</p>
                <p style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0', letterSpacing: '-0.5px' }}>{totalComprasReporte} compras</p>
              </div>
              <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Ticket Promedio</p>
                <p style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0', letterSpacing: '-0.5px' }}>${ticketPromedioReporte.toFixed(2)}</p>
              </div>
              <div style={{ padding: '10px 12px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' }}>
                <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Cliente Destacado</p>
                <p style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {mejorCliente ? mejorCliente.full_name : 'N/A'}
                </p>
              </div>
            </div>

            {/* Tabla 1: Cartera de Clientes */}
            {incluirTablaClientes && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                    Cartera de Clientes Analizada ({clientesParaReporte.length} Clientes)
                  </h3>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Ordenado por consumo decreciente</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Cliente / Razón Social</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center' }}>Tipo</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Documento</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Contacto</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Total Consumo</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center', borderRadius: '0 4px 0 0' }}>Compras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesParaReporte.slice(0, 5).map((c, idx) => (
                      <tr key={c.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: '#0f172a' }}>{c.full_name}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', color: '#475569', fontSize: '9.5px' }}>{c.customer_type}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: '#475569' }}>{c.doc_type}: {c.doc_number}</td>
                        <td style={{ padding: '7px 10px', color: '#64748b', fontSize: '10px' }}>{c.email || c.phone || '—'}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                          ${Number(c.total_amount_spent || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 600 }}>{c.total_purchases_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tabla 2: Rendimiento de Productos */}
            {incluirAnalisisProductos && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                    Rendimiento de Productos Vendidos & Demanda ({productosParaReporte.length} Artículos)
                  </h3>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Ranking por facturación</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>SKU</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Nombre del Producto</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Categoría</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center' }}>Unidades</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Facturación ($)</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Precio Prom.</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center', borderRadius: '0 4px 0 0' }}>Demanda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosParaReporte.slice(0, 5).map((p, idx) => (
                      <tr key={p.sku} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{p.sku}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1e293b' }}>{p.name}</td>
                        <td style={{ padding: '7px 10px', color: '#64748b', fontSize: '10px' }}>{p.category}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>{p.quantity}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                          ${p.totalRevenue.toLocaleString()}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#64748b' }}>${p.avgPrice.toFixed(2)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', backgroundColor: p.demandLevel === 'Alta Rotación' ? '#ecfdf5' : '#f0f9ff', color: p.demandLevel === 'Alta Rotación' ? '#047857' : '#0369a1', border: p.demandLevel === 'Alta Rotación' ? '1px solid #a7f3d0' : '1px solid #bae6fd' }}>
                            {p.demandLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Página 1 */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#94a3b8' }}>
            <span>SalesIA Enterprise Security & BI Engine • Documento Oficial</span>
            <span style={{ fontWeight: 700, color: '#64748b' }}>Página 1 de 2</span>
          </div>
        </div>

        {/* ========================================== */}
        {/* PÁGINA 2: AUDITORÍA DE VENTAS & PLAN DE MEJORA */}
        {/* ========================================== */}
        <div
          className="pdf-page"
          id="pdf-page-2"
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
            {/* Membrete de Continuidad */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>SalesIA Enterprise</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>• Anexo Estratégico & Recomendaciones</span>
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                Período: <strong style={{ color: '#0f172a' }}>{periodoReporte}</strong> | Pág. 2
              </div>
            </div>

            {/* Tabla 3: Historial Reciente de Facturación & Ventas */}
            {incluirHistorialVentas && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                    Historial Reciente de Facturación & Operaciones
                  </h3>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Muestra de auditoría reciente</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Código</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Cliente</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Fecha</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Vendedor Asignado</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Monto</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center', borderRadius: '0 4px 0 0' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasParaReporte.slice(0, 5).map((v, idx) => (
                      <tr key={v.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{v.sale_code}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1e293b' }}>{v.customer_name}</td>
                        <td style={{ padding: '7px 10px', color: '#64748b', fontSize: '10px' }}>{new Date(v.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '7px 10px', color: '#475569' }}>{v.salesperson_name}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                          ${Number(v.total_amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', backgroundColor: v.payment_status === 'PAID' ? '#ecfdf5' : '#fffbeb', color: v.payment_status === 'PAID' ? '#047857' : '#b45309', border: v.payment_status === 'PAID' ? '1px solid #a7f3d0' : '1px solid #fde68a' }}>
                            {v.payment_status === 'PAID' ? 'Cobrado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tabla 4: Plan de Mejora Estratégica (Las 5 ideas completas, sin cortarse) */}
            {incluirIdeasMejora && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                    Plan de Mejora Estratégica & Recomendaciones Comerciales
                  </h3>
                  <span style={{ fontSize: '10px', color: '#047857', fontWeight: 700 }}>5 Ejes Estratégicos</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left', width: '22%' }}>Área Estratégica</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left', width: '26%' }}>Diagnóstico</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left', width: '32%' }}>Acción Recomendada</th>
                      <th style={{ padding: '7px 10px', textAlign: 'left', width: '20%' }}>Impacto Proyectado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ideasMejora.slice(0, 5).map((idea, idx) => (
                      <tr key={idea.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0f172a', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ backgroundColor: '#0284c7', color: '#ffffff', minWidth: '14px', height: '14px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900 }}>{idx + 1}</span>
                            <span>{idea.area}</span>
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px', color: '#475569', verticalAlign: 'top', lineHeight: '1.3' }}>
                          {idea.diagnostico}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#0f172a', fontWeight: 600, verticalAlign: 'top', lineHeight: '1.3' }}>
                          {idea.accion}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#047857', fontWeight: 700, verticalAlign: 'top', lineHeight: '1.3' }}>
                          {idea.impacto}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Personal con Roles (si está activo) */}
            {incluirPersonalRoles && (
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
                  Personal Interno con Roles ({systemUsers.length})
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Colaborador</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Correo Corporativo</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Roles Asignados</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemUsers.slice(0, 4).map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>{u.nombre_completo}</td>
                        <td style={{ padding: '6px 8px', color: '#475569', fontFamily: 'monospace' }}>{u.correo_electronico}</td>
                        <td style={{ padding: '6px 8px', color: '#0284c7' }}>{u.roles.join(', ')}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: u.activo ? '#047857' : '#e11d48' }}>{u.activo ? 'Activo' : 'Inactivo'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sección de Autorización y Firma */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#64748b' }}>
              <div>
                <p style={{ fontWeight: 800, color: '#0f172a', margin: 0 }}>SalesIA Enterprise Security & BI Engine</p>
                <p style={{ margin: '3px 0 0 0', fontSize: '9.5px' }}>Certificación digital de reporte comercial emitida automáticamente.</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#94a3b8' }}>ID Verificación: SEC-RPT-{new Date().getTime().toString().slice(-8)}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1.5px solid #0f172a', width: '180px', height: '24px', marginBottom: '6px' }}></div>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '10.5px' }}>Firma de Dirección General</span>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#64748b' }}>Administración Comercial</p>
              </div>
            </div>
          </div>

          {/* Footer Página 2 */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#94a3b8' }}>
            <span>SalesIA Enterprise Security & BI Engine • Documento Oficial</span>
            <span style={{ fontWeight: 700, color: '#64748b' }}>Página 2 de 2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
