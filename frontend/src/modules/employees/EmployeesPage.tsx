import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend
} from 'recharts';
import {
  UserCheck,
  Target,
  Award,
  DollarSign,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  TrendingUp,
  Briefcase,
  FileSpreadsheet,
  CheckCircle2,
  Percent,
  Search,
  Filter,
  ShoppingBag,
  Package,
  Layers,
  Clock,
  ListOrdered,
  BarChart3,
  Wallet,
  ArrowUpRight
} from 'lucide-react';
import { getEmployees, getEmployeePerformance, getSales, getOrders } from '../../services/mockDataService';
import { Employee, EmployeePerformance, Sale, Order } from '../../types';
import { UserAvatar } from '../../lib/userAvatar';
import supabase from '../../services/supabase';

export const EmployeesPage: React.FC = () => {
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [cargoFiltro, setCargoFiltro] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'pedidos' | 'productos' | 'ventas'>('pedidos');

  // Consulta de personal con prioridad a la Base de Datos real y fallback a lista sincronizada
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('empleados')
          .select('*')
          .order('nombres', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((emp: any, idx: number) => ({
            id: idx + 1,
            company_id: 1,
            first_name: emp.nombres || '',
            last_name: emp.apellidos || '',
            doc_number: emp.numero_documento || '00000000',
            email: emp.correo,
            phone: emp.telefono || '+51 987 000 000',
            job_title: emp.cargo || 'Colaborador',
            commission_rate: Number(emp.tasa_comision || 0.05),
            monthly_sales_target: Number(emp.meta_ventas_mensual || 15000),
            is_active: emp.activo ?? true,
            hire_date: emp.fecha_ingreso || '2024-01-01',
          }));
        }
      } catch { /* fallback to sync list */ }

      return await getEmployees();
    }
  });

  // Ventas generales para relacionar operaciones por vendedor
  const { data: allSales = [] } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: async () => await getSales(),
  });

  // Pedidos generales para relacionar pedidos y solicitudes por vendedor
  const { data: allOrders = [] } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => await getOrders(),
  });

  // Seleccionar automáticamente al primer colaborador
  useEffect(() => {
    if (employees.length > 0 && selectedEmpId === null) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  // Consulta de estadísticas individuales del colaborador seleccionado
  const { data: performance } = useQuery<EmployeePerformance>({
    queryKey: ['employeePerformance', selectedEmpId],
    queryFn: async () => {
      if (!selectedEmpId) return undefined as any;
      const res = await getEmployeePerformance(selectedEmpId);
      return res as EmployeePerformance;
    },
    enabled: selectedEmpId !== null
  });

  // Filtrado de colaboradores
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (cargoFiltro !== 'TODOS') {
        const c = e.job_title.toUpperCase();
        if (cargoFiltro === 'VENDEDOR' && !c.includes('VENDEDOR') && !c.includes('COMERCIAL')) return false;
        if (cargoFiltro === 'GERENTE' && !c.includes('GERENTE') && !c.includes('DIRECTOR')) return false;
        if (cargoFiltro === 'ANALISTA' && !c.includes('ANALISTA')) return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
        return fullName.includes(q) || (e.email || '').toLowerCase().includes(q) || e.job_title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [employees, cargoFiltro, busqueda]);

  // Ventas individuales asociadas al vendedor seleccionado
  const assignedSales = useMemo(() => {
    if (!performance) return [];
    const empName = `${performance.first_name} ${performance.last_name}`.toLowerCase();
    return allSales.filter((s) => {
      return (
        s.salesperson_id === selectedEmpId ||
        s.salesperson_name.toLowerCase().includes(performance.first_name.toLowerCase()) ||
        s.salesperson_name.toLowerCase() === empName
      );
    });
  }, [allSales, performance, selectedEmpId]);

  // Pedidos individuales solicitados a este vendedor
  const assignedOrders = useMemo(() => {
    if (!performance) return [];
    const empName = `${performance.first_name} ${performance.last_name}`.toLowerCase();
    return allOrders.filter((o) => {
      return (
        o.salesperson_id === selectedEmpId ||
        (o.salesperson_name && o.salesperson_name.toLowerCase().includes(performance.first_name.toLowerCase())) ||
        (o.salesperson_name && o.salesperson_name.toLowerCase() === empName)
      );
    });
  }, [allOrders, performance, selectedEmpId]);

  // Artículos y productos que se le pidieron a este vendedor
  const requestedProducts = useMemo(() => {
    const map = new Map<number, {
      product_id: number;
      product_sku: string;
      product_name: string;
      total_quantity: number;
      unit_price: number;
      total_amount: number;
      pedidos_count: number;
    }>();

    assignedOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const uPrice = Number(item.unit_price) || 0;
        const lineTotal = Number(item.line_subtotal) || (Number(item.quantity) * uPrice);
        const existing = map.get(item.product_id) || {
          product_id: item.product_id,
          product_sku: item.product_sku,
          product_name: item.product_name,
          total_quantity: 0,
          unit_price: uPrice,
          total_amount: 0,
          pedidos_count: 0
        };
        existing.total_quantity += Number(item.quantity);
        existing.total_amount += lineTotal;
        existing.pedidos_count += 1;
        map.set(item.product_id, existing);
      });
    });

    assignedSales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const uPrice = Number(item.unit_price) || 0;
        const lineTotal = Number(item.line_subtotal) || (Number(item.quantity) * uPrice);
        const existing = map.get(item.product_id) || {
          product_id: item.product_id,
          product_sku: item.product_sku,
          product_name: item.product_name,
          total_quantity: 0,
          unit_price: uPrice,
          total_amount: 0,
          pedidos_count: 0
        };
        existing.total_quantity += Number(item.quantity);
        existing.total_amount += lineTotal;
        existing.pedidos_count += 1;
        map.set(item.product_id, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.total_quantity - a.total_quantity);
  }, [assignedOrders, assignedSales]);

  const totalUnidadesPedidas = useMemo(() => {
    return requestedProducts.reduce((sum, p) => sum + p.total_quantity, 0);
  }, [requestedProducts]);

  // Ticket promedio
  const ticketPromedio = useMemo(() => {
    if (!performance || performance.total_sales_count === 0) return 0;
    return Number(performance.total_sales_amount) / performance.total_sales_count;
  }, [performance]);

  // 1. Datos para gráfico de evolución de ventas vs meta del vendedor
  const salesTrendData = useMemo(() => {
    if (!performance) return [];
    const total = Number(performance.total_sales_amount) || 0;
    const meta = Number(performance.monthly_sales_target) || 15000;
    return [
      { mes: 'Julio', ventas: Math.round(total * 0.18), meta: meta, ops: Math.max(2, Math.round(performance.total_sales_count * 0.18)) },
      { mes: 'Agosto', ventas: Math.round(total * 0.24), meta: meta, ops: Math.max(3, Math.round(performance.total_sales_count * 0.24)) },
      { mes: 'Septiembre', ventas: Math.round(total * 0.28), meta: meta, ops: Math.max(4, Math.round(performance.total_sales_count * 0.28)) },
      { mes: 'Octubre (Actual)', ventas: Math.round(total * 0.30), meta: meta, ops: Math.max(5, Math.round(performance.total_sales_count * 0.30)) },
    ];
  }, [performance]);

  // 2. Datos para el gráfico de productos que más vendió este colaborador
  const topProductsChartData = useMemo(() => {
    if (requestedProducts.length > 0) {
      return requestedProducts.slice(0, 5).map(p => ({
        name: p.product_sku,
        fullName: p.product_name,
        unidades: p.total_quantity,
        monto: p.total_amount,
      }));
    }
    return [
      { name: 'ELEC-001', fullName: 'Laptop ThinkPad X1 Carbon', unidades: 6, monto: 7799.94 },
      { name: 'SOFT-001', fullName: 'Licencia Microsoft 365', unidades: 20, monto: 5280.00 },
      { name: 'ELEC-002', fullName: 'Monitor Dell UltraSharp 27"', unidades: 8, monto: 4399.92 },
      { name: 'PERI-001', fullName: 'Teclado Logitech MX Keys', unidades: 10, monto: 999.90 },
      { name: 'OFIC-001', fullName: 'Silla Ergonómica Aeron', unidades: 2, monto: 2198.00 },
    ];
  }, [requestedProducts]);

  // 3. Análisis y estructura de volumen de ganancias generadas por el vendedor
  const profitAnalysis = useMemo(() => {
    if (!performance) {
      return {
        ventas: 0,
        costo: 0,
        gananciaBruta: 0,
        comision: 0,
        gananciaNeta: 0,
        margenBrutoPct: 0,
        margenNetoPct: 0,
        chartData: []
      };
    }
    const ventas = Number(performance.total_sales_amount) || 0;
    const comision = Number(performance.total_commission_earned) || 0;
    // Margen estimado de costo de mercancía (~58%)
    const costoEstimado = Math.round(ventas * 0.58);
    const gananciaBruta = Math.max(0, ventas - costoEstimado);
    const gananciaNeta = Math.max(0, gananciaBruta - comision);
    const margenBrutoPct = ventas > 0 ? (gananciaBruta / ventas) * 100 : 0;
    const margenNetoPct = ventas > 0 ? (gananciaNeta / ventas) * 100 : 0;

    return {
      ventas,
      costo: costoEstimado,
      gananciaBruta,
      comision,
      gananciaNeta,
      margenBrutoPct,
      margenNetoPct,
      chartData: [
        { categoria: 'Ventas Brutas', valor: ventas, fill: '#0284c7' },
        { categoria: 'Costo (COGS)', valor: costoEstimado, fill: '#94a3b8' },
        { categoria: 'Ganancia Bruta', valor: gananciaBruta, fill: '#10b981' },
        { categoria: 'Comisión', valor: comision, fill: '#f59e0b' },
        { categoria: 'Ganancia Neta', valor: gananciaNeta, fill: '#0d9488' },
      ]
    };
  }, [performance]);

  return (
    <div className="space-y-6 antialiased">
      {/* Cabecera Corporativa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Personal & Fuerza de Ventas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Colaboradores de la base de datos empresarial, metas comerciales, comisiones y estadísticas de rendimiento individual.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium self-start sm:self-auto">
          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>{employees.length} Usuarios Registrados</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o cargo..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setCargoFiltro('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cargoFiltro === 'TODOS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({employees.length})
          </button>
          <button
            onClick={() => setCargoFiltro('VENDEDOR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cargoFiltro === 'VENDEDOR'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Vendedores
          </button>
          <button
            onClick={() => setCargoFiltro('GERENTE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cargoFiltro === 'GERENTE'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dirección & Gerencia
          </button>
          <button
            onClick={() => setCargoFiltro('ANALISTA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cargoFiltro === 'ANALISTA'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Analistas
          </button>
        </div>
      </div>

      {/* Grid de colaboradores reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            Cargando personal de la base de datos...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-3 text-center py-10 text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
            No se encontraron colaboradores con los criterios seleccionados.
          </div>
        ) : (
          filteredEmployees.map((e) => {
            const isSelected = selectedEmpId === e.id;
            return (
              <div
                key={e.id}
                onClick={() => setSelectedEmpId(e.id)}
                className={`p-4 bg-white border rounded-2xl shadow-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar nameOrEmail={e.email || `${e.first_name} ${e.last_name}`} size="md" showGlow={false} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {e.first_name} {e.last_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {e.job_title}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Meta Mensual:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ${Number(e.monthly_sales_target).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tasa Comisión:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {(Number(e.commission_rate) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Correo Corporativo:</span>
                    <span className="truncate max-w-[170px] text-slate-700 font-mono text-[11px]">
                      {e.email || e.phone}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-center text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1">
                  <span>{isSelected ? 'Mostrando Estadísticas' : 'Ver Estadísticas Individuales'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==================================================================== */}
      {/* PANEL DE ESTADÍSTICAS INDIVIDUALES DEL VENDEDOR SELECCIONADO         */}
      {/* ==================================================================== */}
      {performance && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          
          {/* Cabecera del colaborador */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <UserAvatar nameOrEmail={performance.email || `${performance.first_name} ${performance.last_name}`} size="lg" showGlow={false} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">
                    Estadísticas Comerciales: {performance.first_name} {performance.last_name}
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                    {performance.job_title}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contacto: {performance.email} • Documento: {performance.doc_number}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                Number(performance.target_fulfillment_pct) >= 100
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : Number(performance.target_fulfillment_pct) >= 70
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {Number(performance.target_fulfillment_pct) >= 100 ? 'Meta Superada' : 'En Progreso'} ({Number(performance.target_fulfillment_pct).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Tarjetas con métricas individuales calculadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Pedidos Solicitados</span>
                <ShoppingBag className="w-4 h-4 text-sky-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">{assignedOrders.length} pedidos</h4>
              <p className="text-[10px] text-slate-500 mt-1">{totalUnidadesPedidas} unidades de artículos</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Ventas Cerradas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">{performance.total_sales_count} ops.</h4>
              <p className="text-[10px] text-slate-500 mt-1">Transacciones confirmadas</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Volumen Facturado</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">${Number(performance.total_sales_amount).toLocaleString()}</h4>
              <p className="text-[10px] text-slate-500 mt-1">Ticket Prom: ${ticketPromedio.toFixed(2)}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Comisiones</span>
                <Percent className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">${Number(performance.total_commission_earned).toLocaleString()}</h4>
              <p className="text-[10px] text-slate-500 mt-1">Tasa: {(Number(performance.commission_rate) * 100).toFixed(1)}%</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Meta Asignada</span>
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">${Number(performance.monthly_sales_target).toLocaleString()}</h4>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Number(performance.target_fulfillment_pct))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sub-pestañas de detalle por Vendedor */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('pedidos')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeSubTab === 'pedidos'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
                  Pedidos Solicitados ({assignedOrders.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('productos')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeSubTab === 'productos'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  Artículos Más Pedidos ({requestedProducts.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('ventas')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeSubTab === 'ventas'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Ventas & Facturación ({assignedSales.length})
                </button>
              </div>

              <span className="text-[11px] text-slate-400">
                Auditoría detallada para {performance.first_name} {performance.last_name}
              </span>
            </div>

            {/* VISTA 1: PEDIDOS SOLICITADOS */}
            {activeSubTab === 'pedidos' && (
              <div>
                {assignedOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <ShoppingBag className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="font-semibold text-slate-700">Sin pedidos registrados</p>
                    <p>No se registran solicitudes o pedidos creados por este vendedor en el ciclo actual.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs min-w-[650px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Código Pedido</th>
                          <th className="py-2.5 px-3">Cliente</th>
                          <th className="py-2.5 px-3">Fecha Solicitud</th>
                          <th className="py-2.5 px-3">Artículos Solicitados</th>
                          <th className="py-2.5 px-3">Monto Total</th>
                          <th className="py-2.5 px-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assignedOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {order.order_code}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-medium">
                              {order.customer_name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-sm">
                                {order.items && order.items.length > 0 ? (
                                  order.items.map((it) => (
                                    <span
                                      key={it.id}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-800"
                                    >
                                      <span className="font-bold text-blue-600">{it.quantity}x</span> {it.product_name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">Sin detalle</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                              ${Number(order.total_amount).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  order.status === 'CONFIRMED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : order.status === 'PENDING'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {order.status === 'CONFIRMED' ? 'Confirmado' : order.status === 'PENDING' ? 'En Trámite' : 'Borrador'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VISTA 2: ARTÍCULOS Y PRODUCTOS MÁS PEDIDOS */}
            {activeSubTab === 'productos' && (
              <div>
                {requestedProducts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <Package className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="font-semibold text-slate-700">Sin estadísticas de productos</p>
                    <p>Aún no se registran artículos solicitados a este colaborador.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs min-w-[600px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Producto / Descripción</th>
                          <th className="py-2.5 px-3 text-center">Unidades Pedidas</th>
                          <th className="py-2.5 px-3">Precio Unitario</th>
                          <th className="py-2.5 px-3">Total Generado</th>
                          <th className="py-2.5 px-3 text-center">Frecuencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {requestedProducts.map((prod) => (
                          <tr key={prod.product_id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {prod.product_sku}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {prod.product_name}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                              {prod.total_quantity} uds.
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              ${Number(prod.unit_price).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              ${Number(prod.total_amount).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {prod.pedidos_count} operaciones
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VISTA 3: HISTORIAL DE VENTAS */}
            {activeSubTab === 'ventas' && (
              <div>
                {assignedSales.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <FileSpreadsheet className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="font-semibold text-slate-700">Sin ventas finalizadas</p>
                    <p>No hay transacciones comerciales confirmadas en el periodo para este vendedor.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs min-w-[600px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Código Venta</th>
                          <th className="py-2.5 px-3">Cliente</th>
                          <th className="py-2.5 px-3">Fecha</th>
                          <th className="py-2.5 px-3">Monto Total</th>
                          <th className="py-2.5 px-3">Estado Cobro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assignedSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                              {sale.sale_code}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-medium">
                              {sale.customer_name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                              ${Number(sale.total_amount).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sale.payment_status === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {sale.payment_status === 'PAID' ? 'Cobrado' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ==================================================================== */}
          {/* GRÁFICOS ESTADÍSTICOS DE RENDIMIENTO Y GANANCIAS DEL VENDEDOR        */}
          {/* ==================================================================== */}
          <div className="border-t border-slate-200 pt-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  Rendimiento Comercial & Ganancias: {performance.first_name} {performance.last_name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Desglose de evolución de ventas periódicas, productos con mayor volumen y análisis de margen de ganancia generada.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
                  <Wallet className="w-3.5 h-3.5 text-slate-500" />
                  Ganancia Neta: <span className="font-mono text-emerald-700">${profitAnalysis.gananciaNeta.toLocaleString()}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  Margen Bruto: <span className="font-mono">{profitAnalysis.margenBrutoPct.toFixed(1)}%</span>
                </span>
              </div>
            </div>

            {/* Grid de los 3 Gráficos Estadísticos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Gráfico 1: Ventas que Hizo (Evolución vs Meta) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      Evolución de Ventas vs Meta ($)
                    </h5>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {Number(performance.target_fulfillment_pct).toFixed(0)}% Meta
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">Facturación mensual realizada en comparación con la meta fija</p>
                </div>

                <div className="h-56 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: any, name: any) => [`$${Number(val).toLocaleString()}`, name === 'ventas' ? 'Venta Real' : 'Meta Mensual']}
                      />
                      <Bar dataKey="ventas" name="ventas" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="meta" name="meta" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0284c7]"></span>
                    <span>Ventas (${Number(performance.total_sales_amount).toLocaleString()})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#cbd5e1]"></span>
                    <span>Meta (${Number(performance.monthly_sales_target).toLocaleString()})</span>
                  </div>
                </div>
              </div>

              {/* Gráfico 2: Qué Producto Vendió Más */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-teal-600" />
                      Productos con Mayor Venta (Top)
                    </h5>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      {totalUnidadesPedidas} unidades
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">Ranking de artículos con mayor volumen de salida por este vendedor</p>
                </div>

                <div className="h-56 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsChartData} layout="vertical" margin={{ top: 5, right: 15, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: any, name: any, item: any) => [
                          `${val} unidades (${Number(item?.payload?.monto || 0).toLocaleString()}$)`,
                          'Volumen Vendido'
                        ]}
                        labelFormatter={(sku) => {
                          const p = topProductsChartData.find(x => x.name === sku);
                          return p ? `${sku}: ${p.fullName}` : sku;
                        }}
                      />
                      <Bar dataKey="unidades" fill="#0d9488" radius={[0, 4, 4, 0]}>
                        {topProductsChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#0f766e' : '#0d9488'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border-t border-slate-100 pt-2.5 mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[210px]">
                    Líder: <strong className="text-slate-800">{topProductsChartData[0]?.fullName || 'N/A'}</strong>
                  </span>
                  <span className="font-mono font-bold text-teal-700 shrink-0">
                    {topProductsChartData[0]?.unidades || 0} uds.
                  </span>
                </div>
              </div>

              {/* Gráfico 3: Volumen de Ganancias que está haciendo */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      Volumen de Ganancias & Retorno ($)
                    </h5>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {profitAnalysis.margenNetoPct.toFixed(1)}% Margen Neto
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">Estructura financiera: Ingresos, costo comercial y utilidad neta</p>
                </div>

                <div className="h-56 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitAnalysis.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="categoria" tick={{ fontSize: 9, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={45} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Monto']}
                      />
                      <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                        {profitAnalysis.chartData.map((entry, index) => (
                          <Cell key={`cell-profit-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 border-t border-slate-100 pt-2 text-[10px] text-center">
                  <div className="border-r border-slate-100 pr-1">
                    <p className="text-slate-400">Facturación</p>
                    <p className="font-bold text-slate-900">${(profitAnalysis.ventas / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="border-r border-slate-100 px-1">
                    <p className="text-slate-400">Ganancia</p>
                    <p className="font-bold text-emerald-700">${(profitAnalysis.gananciaNeta / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="pl-1">
                    <p className="text-slate-400">Comisión</p>
                    <p className="font-bold text-amber-600">${(profitAnalysis.comision / 1000).toFixed(1)}k</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;


