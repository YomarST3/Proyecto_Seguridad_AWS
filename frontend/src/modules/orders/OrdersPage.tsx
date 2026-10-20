import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Plus, CheckCircle, XCircle, Search, ShoppingCart, User, X } from 'lucide-react';
import { getOrders, getCustomers, getProducts, createOrder, confirmOrder, cancelOrder } from '../../services/mockDataService';
import { Order, Customer, Product } from '../../types';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<Array<{ product_id: number; quantity: number }>>([
    { product_id: 1, quantity: 1 }
  ]);
  const [notes, setNotes] = useState('');

  // Queries
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders', selectedStatus],
    queryFn: async () => {
      return await getOrders({ status: selectedStatus || undefined });
    }
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => await getCustomers()
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => await getProducts()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customer_id: customerId,
        items: orderItems,
        notes
      };
      return await createOrder(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsCreateModalOpen(false);
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await confirmOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await cancelOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pedidos & Cotizaciones</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Solicitudes comerciales, reservación anticipada de stock y control de estados.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Pedido</span>
        </button>
      </div>

      {/* Filter by status */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {['', 'PENDING', 'CONFIRMED', 'FULFILLED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === st
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st === '' ? 'Todos' : st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Vendedor</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Cargando pedidos...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">No hay pedidos registrados con el filtro seleccionado.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.order_code}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{o.customer_name}</td>
                    <td className="py-3 px-4 text-slate-600">{o.salesperson_name}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${Number(o.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.status === 'CONFIRMED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : o.status === 'FULFILLED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      {o.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => confirmMutation.mutate(o.id)}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold text-xs p-1 rounded hover:bg-emerald-50"
                            title="Confirmar y reservar stock"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirmar</span>
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(o.id)}
                            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold text-xs p-1 rounded hover:bg-rose-50"
                            title="Cancelar pedido"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </>
                      )}
                      {o.status === 'CONFIRMED' && (
                        <button
                          onClick={() => cancelMutation.mutate(o.id)}
                          className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold text-xs p-1 rounded hover:bg-rose-50"
                          title="Cancelar y liberar reserva de existencias"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Liberar Reserva</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Pedido */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Crear Pedido Comercial</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cliente</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.doc_number})</option>
                  ))}
                </select>
              </div>

              {/* Items selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Productos del Pedido</label>
                <div className="space-y-2">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <select
                        value={item.product_id}
                        onChange={(e) => {
                          const updated = [...orderItems];
                          updated[idx].product_id = Number(e.target.value);
                          setOrderItems(updated);
                        }}
                        className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - ${Number(p.sale_price).toFixed(2)} (Stock Disp: {p.available_stock})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[idx].quantity = parseInt(e.target.value) || 1;
                            setOrderItems(updated);
                          }}
                          className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-center"
                        />
                        <span className="text-[11px] text-slate-400 sm:hidden">uds.</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOrderItems([...orderItems, { product_id: products[0]?.id || 1, quantity: 1 }])}
                  className="mt-2 text-[11px] font-semibold text-sky-600 hover:text-sky-700"
                >
                  + Agregar otra línea
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notas Comerciales</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Condiciones de despacho o términos de entrega"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 font-semibold text-white shadow-xs"
                >
                  {createMutation.isPending ? 'Guardando...' : 'Crear Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
