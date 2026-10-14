import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, TrendingUp, Calculator, Scale, Layers } from 'lucide-react';
import api from '../../services/api';
import { DashboardSummary } from '../../types';

export const AnalyticsPage: React.FC = () => {
  // Query live metrics from database
  const { data: statsData } = useQuery({
    queryKey: ['liveSalesStats'],
    queryFn: async () => (await api.get('/statistics/live-sales-metrics')).data
  });

  const { data: dashData } = useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data
  });

  const metrics = statsData?.metrics;

  const topProductsChartData = (dashData?.top_selling_products || []).map((p) => ({
    name: p.sku,
    fullName: p.product_name,
    unidades: p.units_sold,
    ingresos: Number(p.total_revenue)
  }));

  const COLORS = ['#0284c7', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inteligencia Comercial & Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Procesamiento descriptivo de la Semana 07: Media, Mediana, clasificación de variables y distribución empírica.
        </p>
      </div>

      {/* Media vs. Mediana Comparison Card */}
      {metrics && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-sky-600 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">
                Análisis Comparativo de Centralidad (Media vs. Mediana)
              </h3>
            </div>
            <span className="self-start sm:self-auto text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
              Muestra: {metrics.sample_size} ventas válidas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl text-center">
              <p className="text-xs font-semibold text-slate-500">Media Aritmética (x̄)</p>
              <h4 className="text-2xl font-bold text-sky-900 mt-1">${Number(metrics.mean).toFixed(2)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">Ticket promedio sensible a valores extremos</p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center">
              <p className="text-xs font-semibold text-slate-500">Mediana (Me)</p>
              <h4 className="text-2xl font-bold text-emerald-900 mt-1">${Number(metrics.median).toFixed(2)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">Valor central que divide la muestra en 50%</p>
            </div>

            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-center">
              <p className="text-xs font-semibold text-slate-500">Disparidad Numérica (Δ)</p>
              <h4 className="text-2xl font-bold text-indigo-900 mt-1">
                {metrics.difference > 0 ? `+$${metrics.difference.toFixed(2)}` : `-$${Math.abs(metrics.difference).toFixed(2)}`}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Variación relativa: {metrics.relative_difference_pct}%</p>
            </div>
          </div>

          {/* Academic explanation */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>Forma de la Distribución:</span>
              <span className="text-sky-700 font-bold">{metrics.distribution_shape}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{metrics.interpretation}</p>
          </div>
        </div>
      )}

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unidades vendidas por producto */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs min-w-0">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Unidades Vendidas por Ítem de Catálogo</h3>
          <p className="text-[11px] text-slate-400 mb-4">Volumen físico despachado en operaciones válidas</p>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} unidades`, 'Cantidad']}
                  labelFormatter={(sku) => {
                    const found = topProductsChartData.find((x) => x.name === sku);
                    return found?.fullName || sku;
                  }}
                />
                <Bar dataKey="unidades" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facturación acumulada por producto */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs min-w-0">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Ingresos Generados por Producto ($)</h3>
          <p className="text-[11px] text-slate-400 mb-4">Distribución de ingresos por producto</p>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Ingresos']}
                  labelFormatter={(sku) => {
                    const found = topProductsChartData.find((x) => x.name === sku);
                    return found?.fullName || sku;
                  }}
                />
                <Bar dataKey="ingresos" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Taxonomía de Variables Estadísticas (Semana 07) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Clasificación de Variables Estadísticas del Sistema (Semana 07)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider">Cualitativa Nominal</span>
            <h4 className="font-bold text-slate-900 mt-1">Método de Pago / Categoría</h4>
            <p className="text-[11px] text-slate-500 mt-1">Valores categóricos sin orden intrínseco (Efectivo, Tarjeta, Transferencia).</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-purple-600 tracking-wider">Cualitativa Ordinal</span>
            <h4 className="font-bold text-slate-900 mt-1">Nivel de Fidelidad</h4>
            <p className="text-[11px] text-slate-500 mt-1">Jerarquía o rango ordenado de clientes (Bronce, Plata, Oro, Platino).</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Cuantitativa Discreta</span>
            <h4 className="font-bold text-slate-900 mt-1">Cantidad Vendida / Compras</h4>
            <p className="text-[11px] text-slate-500 mt-1">Conteo de valores enteros cardinales (1, 2, 3 unidades).</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Cuantitativa Continua</span>
            <h4 className="font-bold text-slate-900 mt-1">Importe de Venta / Margen %</h4>
            <p className="text-[11px] text-slate-500 mt-1">Magnitudes numéricas medibles con decimales en una escala real continua.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
