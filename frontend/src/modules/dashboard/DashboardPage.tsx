import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  Clock,
  AlertTriangle,
  ShoppingBag,
  Package,
  ShieldCheck,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  Percent,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { getDashboardSummary } from '../../services/mockDataService';
import { DashboardSummary } from '../../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(true);
  const [activeTab, setActiveTab] = useState<'todos' | 'financiero' | 'almacen'>('todos');

  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      return await getDashboardSummary();
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-neutral-500 font-medium animate-pulse">Sincronizando consola operativa...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
        <span>Error al cargar los indicadores operativos del Dashboard.</span>
      </div>
    );
  }

  // Tasa de efectividad de cobranza
  const salesTotal = Number(data.confirmed_sales_total) || 1;
  const cashTotal = Number(data.collected_cash_total) || 0;
  const collectionRate = Math.min(100, Math.round((cashTotal / salesTotal) * 100));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ========================================================================= */}
      {/* HEADER MINIMALISTA CON INDICADORES Y SELECTOR DE VISTA                   */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                <Activity className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Dashboard General</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />

              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Consola de supervisión ejecutiva: ventas, tesorería, reservas e inventario físico auditado.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 text-xs bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-3 py-2 rounded-xl font-medium text-neutral-700 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
              <span>{showGuide ? 'Ocultar Guía' : 'Explicación del Módulo'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
            </button>

            <div className="inline-flex items-center gap-1.5 text-xs bg-neutral-100 border border-neutral-200 px-3 py-2 rounded-xl text-neutral-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-neutral-700 shrink-0" />
              <span>Cifrado TLS 1.3</span>
            </div>
          </div>
        </div>

        {/* Pestañas de filtrado minimalistas */}
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'todos'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
          >
            Vista Integral
          </button>
          <button
            onClick={() => setActiveTab('financiero')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'financiero'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
          >
            Flujo Financiero
          </button>
          <button
            onClick={() => setActiveTab('almacen')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'almacen'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
          >
            Salud de Almacén
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARDS CHICAS INFORMATIVAS MINIMALISTAS (EXPLICAN EL MÓDULO)              */}
      {/* ========================================================================= */}
      {showGuide && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 animate-in fade-in duration-200">
          <div className="p-4 bg-white border border-neutral-200/90 rounded-2xl shadow-2xs hover:border-neutral-300 transition-all group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
                <div className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center text-[11px] font-bold">
                  1
                </div>
                <span>¿En qué consiste el Dashboard?</span>
              </div>
              <Info className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Consola unificada que agrega compromisos mercantiles facturados, tesorería disponible y existencias críticas de inventario.
            </p>
          </div>

          <div className="p-4 bg-white border border-neutral-200/90 rounded-2xl shadow-2xs hover:border-neutral-300 transition-all group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
                <div className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center text-[11px] font-bold">
                  2
                </div>
                <span>Aislamiento de Cifras</span>
              </div>
              <CheckCircle className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              <strong>Ventas</strong>: Facturas comerciales emitidas. <strong>Cobros</strong>: Dinero efectivamente recaudado en cuenta. <strong>Pedidos</strong>: Solicitudes en trámite.
            </p>
          </div>

          <div className="p-4 bg-white border border-neutral-200/90 rounded-2xl shadow-2xs hover:border-neutral-300 transition-all group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
                <div className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center text-[11px] font-bold">
                  3
                </div>
                <span>Navegación e Interacción</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Usa los botones de acción rápida para registrar operaciones con deducción directa de inventario o calcular modelos estadísticos.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GRID DE KPIs PRINCIPALES CON ANIMACIONES HOVER Y DETALLE DE CONVERSIÓN    */}
      {/* ========================================================================= */}
      {(activeTab === 'todos' || activeTab === 'financiero') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Ventas Confirmadas */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Ventas Confirmadas</span>
              <div className="w-9 h-9 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-colors shadow-2xs">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3.5">
              <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
                ${Number(data.confirmed_sales_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px] text-neutral-500">
                <span>Total facturación válida</span>
                <span className="font-semibold text-neutral-800">Compromiso</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Ingresos Cobrados */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Ingresos Cobrados</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3.5">
              <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
                ${Number(data.collected_cash_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px] text-neutral-500">
                <span>Efectivo en tesorería</span>
                <span className="font-semibold text-emerald-700">{collectionRate}% Cobrado</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Pedidos Pendientes */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Pedidos en Trámite</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3.5">
              <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {data.pending_orders_count}
              </h3>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px] text-neutral-500">
                <span>Órdenes por liquidar</span>
                <span className="font-semibold text-amber-700">Por Despachar</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Stock Crítico */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Stock Crítico</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3.5">
              <h3 className="text-2xl font-bold text-rose-700 tracking-tight">
                {data.low_stock_products_count}
              </h3>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px] text-neutral-500">
                <span>Bajo punto de reorden</span>
                <span className="font-semibold text-rose-700">Reabastecer</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA DE SALUD DE RECAUDACIÓN Y CONVERSIÓN FINANCIERA                     */}
      {/* ========================================================================= */}
      {(activeTab === 'todos' || activeTab === 'financiero') && (
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900">Efectividad de Cobro de Facturación</h4>
              <p className="text-[11px] text-neutral-500">
                ${cashTotal.toLocaleString()} cobrados de ${salesTotal.toLocaleString()} facturados en el periodo
              </p>
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-neutral-800">
              <span>Recaudación</span>
              <span>{collectionRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACCIONES OPERATIVAS CON CARDS Y DESCRIPCIONES DE CADA BOTÓN               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neutral-800" />
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Acciones y Módulos del Sistema
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">Guía de operación de cada sección</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            onClick={() => navigate('/ventas')}
            className="p-4 text-left rounded-2xl bg-neutral-50/80 hover:bg-neutral-100 border border-neutral-200/70 transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-xs text-neutral-900 group-hover:text-black">Registrar Venta</h4>
            <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
              Emite una orden mercantil con reserva inmediata en el kardex de inventario.
            </p>
          </button>

          <button
            onClick={() => navigate('/inventario')}
            className="p-4 text-left rounded-2xl bg-neutral-50/80 hover:bg-neutral-100 border border-neutral-200/70 transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-xs text-neutral-900 group-hover:text-black">Auditar Almacén</h4>
            <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
              Ajusta existencias físicas por recepción de proveedor o mermas operativas.
            </p>
          </button>

          <button
            onClick={() => navigate('/probabilidades')}
            className="p-4 text-left rounded-2xl bg-neutral-50/80 hover:bg-neutral-100 border border-neutral-200/70 transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                <Calculator className="w-3.5 h-3.5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-xs text-neutral-900 group-hover:text-black">Inferencia Bayesiana</h4>
            <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
              Modela probabilidades condicionales a posteriori basadas en ventas históricas.
            </p>
          </button>

          <button
            onClick={() => navigate('/reportes')}
            className="p-4 text-left rounded-2xl bg-neutral-50/80 hover:bg-neutral-100 border border-neutral-200/70 transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-xs text-neutral-900 group-hover:text-black">Exportar Cierre</h4>
            <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
              Descarga balances contables en formatos tabulares listos para auditoría.
            </p>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOS COLUMNAS: VENTAS AUDITADAS & PRODUCTOS CON ROTACIÓN                   */}
      {/* ========================================================================= */}
      {(activeTab === 'todos' || activeTab === 'almacen' || activeTab === 'financiero') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas Recientes */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">Ventas Recientes Auditadas</h3>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">Últimas 5 operaciones</span>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse min-w-[420px]">
                <thead>
                  <tr className="border-b border-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    <th className="pb-3">Código</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3 text-right">Monto</th>
                    <th className="pb-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {data.recent_sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 font-semibold text-neutral-900 font-mono text-[11px]">{sale.sale_code}</td>
                      <td className="py-3 text-neutral-600 truncate max-w-[150px]">{sale.customer_name}</td>
                      <td className="py-3 text-right font-medium text-neutral-900">
                        ${Number(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sale.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                          : sale.payment_status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                          }`}>
                          {sale.payment_status === 'PAID' ? 'COBRADO' : sale.payment_status === 'PARTIAL' ? 'PARCIAL' : 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Productos con Mayor Rotación */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">Rotación de Artículos</h3>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">Por volumen despachado</span>
            </div>

            <div className="space-y-3">
              {data.top_selling_products.map((item, idx) => (
                <div key={item.product_id} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50/70 border border-neutral-100 gap-2 hover:border-neutral-300 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate">{item.product_name}</p>
                      <p className="text-[10px] text-neutral-400">SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-neutral-900">{item.units_sold} uds.</p>
                    <p className="text-[10px] text-neutral-500">${Number(item.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;


