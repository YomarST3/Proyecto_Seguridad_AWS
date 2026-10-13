import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  CreditCard,
  Clock,
  AlertTriangle,
  Users,
  Package,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { DashboardSummary } from '../../types';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data;
    },
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
        Error al cargar los indicadores operativos del Dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard Operativo</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas comerciales en tiempo real auditadas directamente desde PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Datos Financieros Inmutables</span>
        </div>
      </div>

      {/* Distinction Reminder Banner (Rule 9) */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-xs text-sky-900 leading-relaxed">
          <strong>Aislamiento Contable:</strong> Las <em>Ventas</em> representan compromisos comerciales válidos; los <em>Ingresos Cobrados</em> reflejan el flujo de caja recibido; y los <em>Pedidos</em> corresponden a solicitudes no facturadas.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ventas Confirmadas */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ventas Confirmadas</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              ${Number(data.confirmed_sales_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Facturación comercial válida</p>
          </div>
        </div>

        {/* Card 2: Ingresos Cobrados */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ingresos Cobrados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              ${Number(data.collected_cash_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Dinero efectivamente recaudado</p>
          </div>
        </div>

        {/* Card 3: Pedidos Pendientes */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pedidos Pendientes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {data.pending_orders_count}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Órdenes en trámite / reserva</p>
          </div>
        </div>

        {/* Card 4: Alertas de Stock */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock Bajo / Crítico</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-600 tracking-tight">
              {data.low_stock_products_count}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Productos por reabastecer</p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Ventas Recientes & Productos Más Vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Recientes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-sky-600" />
              <span>Ventas Recientes</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Últimas 5 operaciones</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5">Código</th>
                  <th className="pb-2.5">Cliente</th>
                  <th className="pb-2.5 text-right">Total</th>
                  <th className="pb-2.5 text-right">Estado Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.recent_sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-800">{sale.sale_code}</td>
                    <td className="py-2.5 text-slate-600 truncate max-w-[150px]">{sale.customer_name}</td>
                    <td className="py-2.5 text-right font-medium text-slate-900">
                      ${Number(sale.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sale.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sale.payment_status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {sale.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Productos Más Vendidos */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-600" />
              <span>Productos Más Vendidos</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Por volumen de unidades</span>
          </div>

          <div className="space-y-3">
            {data.top_selling_products.map((item, idx) => (
              <div key={item.product_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{item.product_name}</p>
                    <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">{item.units_sold} uds.</p>
                  <p className="text-[10px] text-slate-500">${Number(item.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
