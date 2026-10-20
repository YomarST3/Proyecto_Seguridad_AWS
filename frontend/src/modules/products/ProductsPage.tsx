import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, Tag, DollarSign, Percent, AlertCircle, X } from 'lucide-react';
import { getProducts, getCategories, createProduct } from '../../services/mockDataService';
import { Product, Category } from '../../types';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category_id: 1,
    sku: '',
    name: '',
    description: '',
    cost_price: 100,
    sale_price: 150,
    tax_rate: 0.18,
    min_stock_alert: 5,
    initial_stock: 10
  });

  // Query products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', searchTerm, selectedCategory],
    queryFn: async () => {
      return await getProducts({
        search: searchTerm,
        category_id: selectedCategory ? Number(selectedCategory) : undefined
      });
    }
  });

  // Query categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      return await getCategories();
    }
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      return await createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateModalOpen(false);
      setFormData({
        category_id: categories[0]?.id || 1,
        sku: '',
        name: '',
        description: '',
        cost_price: 100,
        sale_price: 150,
        tax_rate: 0.18,
        min_stock_alert: 5,
        initial_stock: 10
      });
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Dynamic calculated margin in form
  const formMargin = Math.max(0, formData.sale_price - formData.cost_price);
  const formMarginPct = formData.sale_price > 0 ? (formMargin / formData.sale_price) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Catálogo de Productos</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
              SKU Maestro
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestión de catálogo, especificaciones, costos y márgenes comerciales calculados en tiempo real.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200/70 px-3 py-1.5 rounded-xl">
            <Tag className="w-3.5 h-3.5 text-neutral-400" />
            <span>Margen sugerido &gt; 25%</span>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            title="Añade un nuevo artículo al catálogo maestro y genera su saldo inicial de inventario"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Producto</span>
          </button>
        </div>
      </div>

      {/* Cards Chicas Informativas del Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 animate-in fade-in duration-200">
        <div className="p-3.5 bg-white border border-neutral-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs mb-1">
            <Package className="w-4 h-4 text-neutral-700" />
            <span>Catálogo Centralizado</span>
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            Codificación única por SKU. Cada artículo registrado queda listo para ser facturado en Ventas o reabastecido en Almacén.
          </p>
        </div>

        <div className="p-3.5 bg-white border border-neutral-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs mb-1">
            <Percent className="w-4 h-4 text-emerald-700" />
            <span>Cálculo Automático de Margen</span>
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            Fórmula matemática: <code className="bg-neutral-100 px-1 py-0.5 rounded text-[10px] font-mono text-neutral-800">(Precio - Costo) / Precio</code>. Te asegura rentabilidad en cada cotización.
          </p>
        </div>

        <div className="p-3.5 bg-white border border-neutral-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs mb-1">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Alertas de Punto de Reorden</span>
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            Cuando el stock disponible cae por debajo de la alerta configurada, se activa el distintivo rojo de reabastecimiento crítico.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 w-full bg-neutral-50/80 px-3 py-2 rounded-xl border border-neutral-200/60">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o código SKU..."
            className="w-full text-xs bg-transparent border-none focus:outline-none placeholder-neutral-400 text-neutral-900"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 focus:outline-none text-neutral-800 w-full sm:w-auto cursor-pointer"
        >
          <option value="">Todas las Categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Producto & Categoría</th>
                <th className="py-3 px-4 text-right">Costo Unit.</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-right">Margen Bruto</th>
                <th className="py-3 px-4 text-right">Stock Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-400">Cargando productos del catálogo...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-400">No se encontraron productos en el catálogo.</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-neutral-800">{p.sku}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900">{p.name}</div>
                      <div className="text-[11px] text-neutral-400">{p.category_name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-neutral-500">${Number(p.cost_price).toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-900">${Number(p.sale_price).toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-emerald-700">+${Number(p.unit_margin).toFixed(2)}</div>
                      <div className="text-[10px] text-neutral-400 font-medium">({Number(p.margin_percentage).toFixed(1)}%)</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.available_stock <= p.min_stock_alert
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                      }`}>
                        {p.available_stock} unidades
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Producto */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Producto</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">SKU Único</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. PROD-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Categoría</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre oficial del producto"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Costo de Adquisición ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Precio de Venta ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Live calculated margin indicator */}
              <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <span className="font-medium">Margen Calculado:</span>
                <span className="font-bold">${formMargin.toFixed(2)} ({formMarginPct.toFixed(1)}% sobre venta)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initial_stock}
                    onChange={(e) => setFormData({ ...formData, initial_stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Alerta Stock Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_stock_alert}
                    onChange={(e) => setFormData({ ...formData, min_stock_alert: parseInt(e.target.value) || 5 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 font-semibold text-neutral-700 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black font-semibold text-white shadow-xs cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
