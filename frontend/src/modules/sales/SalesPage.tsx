import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, Plus, Eye, Ban, Search, FileText, X } from 'lucide-react';
import { getSales, getCustomers, getProducts, getPaymentMethods, getOrders, createSale, annulSale } from '../../services/mockDataService';
import { Sale, Customer, Product, PaymentMethod, Order } from '../../types';

export const SalesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAnnulModalOpen, setIsAnnulModalOpen] = useState(false);
  const [annulSaleId, setAnnulSaleId] = useState<number | null>(null);
  const [annulReason, setAnnulReason] = useState('Error en facturación o solicitud del cliente');

  // Form state for new sale
  const [customerId, setCustomerId] = useState<number>(1);
  const [orderId, setOrderId] = useState<string>('');
  const [items, setItems] = useState<Array<{ product_id: number; quantity: number }>>([
    { product_id: 1, quantity: 1 }
  ]);
  const [paymentMethodId, setPaymentMethodId] = useState<number>(1);
  const [payDirectly, setPayDirectly] = useState(true);

  // Queries
  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: async () => await getSales()
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => await getCustomers()
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => await getProducts()
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['paymentMethods'],
    queryFn: async () => await getPaymentMethods()
  });

  const { data: confirmedOrders = [] } = useQuery<Order[]>({
    queryKey: ['confirmedOrders'],
    queryFn: async () => await getOrders({ status: 'CONFIRMED' })
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      // Calculate estimated total for full initial payment if checked
      let estimatedTotal = 0;
      items.forEach((item) => {
        const p = products.find((x) => x.id === item.product_id);
        if (p) estimatedTotal += Number(p.sale_price) * item.quantity * 1.18;
      });

      const payload = {
        customer_id: customerId,
        order_id: orderId ? Number(orderId) : undefined,
        items,
        payment_method_id: payDirectly ? paymentMethodId : undefined,
        paid_amount: payDirectly ? estimatedTotal : 0,
        payment_reference: payDirectly ? 'PAGO_CAJA_VENTA' : undefined
      };
      return await createSale(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsCreateModalOpen(false);
    }
  });

  const annulMutation = useMutation({
    mutationFn: async () => {
      if (!annulSaleId) return;
      return await annulSale(annulSaleId, annulReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsAnnulModalOpen(false);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Registro de Ventas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operaciones comerciales formalizadas, snapshot inmutable de precios y cobranzas asociadas.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Venta</span>
        </button>
      </div>
      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Impuestos</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Estado Venta</th>
                <th className="py-3 px-4 text-center">Estado Cobro</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">Cargando ventas...</td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">No hay ventas registradas.</td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.sale_code}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{s.customer_name}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">${Number(s.subtotal).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">${Number(s.tax_amount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${Number(s.total_amount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.payment_status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {s.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="p-1 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded"
                        title="Ver Detalle Inmutable"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {s.status === 'CONFIRMED' && (
                        <button
                          onClick={() => {
                            setAnnulSaleId(s.id);
                            setIsAnnulModalOpen(true);
                          }}
                          className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Anular venta y reingresar existencias"
                        >
                          <Ban className="w-3.5 h-3.5" />
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

      {/* Modal Detalle Inmutable de Venta */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Detalle Fiscal de Venta: {selectedSale.sale_code}</h3>
                <p className="text-[11px] text-slate-400">Cliente: {selectedSale.customer_name} • Vendedor: {selectedSale.salesperson_name}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[400px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase">
                    <th className="py-2">Ítem</th>
                    <th className="py-2 text-center">Cant.</th>
                    <th className="py-2 text-right">Precio Hist.</th>
                    <th className="py-2 text-right">Costo Hist.</th>
                    <th className="py-2 text-right">Total Línea</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSale.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 font-medium text-slate-800">{item.product_name}</td>
                      <td className="py-2 text-center font-mono">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-2 text-right font-mono text-slate-400">${Number(item.unit_cost).toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-bold text-slate-900">${Number(item.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal Neto:</span>
                <span className="font-mono">${Number(selectedSale.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuesto (IGV 18%):</span>
                <span className="font-mono">${Number(selectedSale.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                <span>Total Operación:</span>
                <span className="font-mono">${Number(selectedSale.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                <span>Importe Cobrado:</span>
                <span className="font-mono">${Number(selectedSale.paid_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-semibold">
                <span>Saldo Pendiente:</span>
                <span className="font-mono">${Number(selectedSale.pending_balance).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Venta */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nueva Venta</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-3.5 text-xs"
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

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Convertir desde Pedido Confirmado (Opcional)</label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Venta Directa en Mostrador (Sin pedido previo)</option>
                  {confirmedOrders.map((o) => (
                    <option key={o.id} value={o.id}>{o.order_code} - {o.customer_name} (${Number(o.total_amount).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Productos a Facturar</label>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <select
                        value={item.product_id}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].product_id = Number(e.target.value);
                          setItems(updated);
                        }}
                        className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - ${Number(p.sale_price).toFixed(2)} (Disp: {p.available_stock})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].quantity = parseInt(e.target.value) || 1;
                            setItems(updated);
                          }}
                          className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-center"
                        />
                        <span className="text-[11px] text-slate-400 sm:hidden">uds.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={payDirectly}
                    onChange={(e) => setPayDirectly(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                  <span>Cobrar íntegramente en esta operación</span>
                </label>

                {payDirectly && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Método de Pago</label>
                    <select
                      value={paymentMethodId}
                      onChange={(e) => setPaymentMethodId(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                    >
                      {paymentMethods.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                  {createMutation.isPending ? 'Facturando...' : 'Confirmar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Anular Venta */}
      {isAnnulModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <h3 className="font-bold text-rose-600 text-sm flex items-center gap-2">
              <Ban className="w-4 h-4" />
              <span>Anulación Autorizada de Venta</span>
            </h3>
            <p className="text-xs text-slate-600">
              Esta acción revertirá los estados y reingresará físicamente las existencias al inventario.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Motivo de Anulación</label>
              <textarea
                rows={2}
                value={annulReason}
                onChange={(e) => setAnnulReason(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAnnulModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => annulMutation.mutate()}
                disabled={annulMutation.isPending}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                {annulMutation.isPending ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
