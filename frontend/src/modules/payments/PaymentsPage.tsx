import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, DollarSign, Search, CheckCircle2, X } from 'lucide-react';
import api from '../../services/api';
import { Payment, PaymentMethod, Sale } from '../../types';

export const PaymentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Form state
  const [selectedSaleId, setSelectedSaleId] = useState<number>(1);
  const [paymentMethodId, setPaymentMethodId] = useState<number>(1);
  const [amount, setAmount] = useState<number>(100);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('Cobro procesado en caja');

  // Queries
  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: async () => (await api.get('/sales')).data
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['paymentMethods'],
    queryFn: async () => (await api.get('/payments/methods')).data
  });

  // Sales with pending balance
  const pendingSales = sales.filter((s) => Number(s.pending_balance) > 0 && s.status === 'CONFIRMED');

  const selectedSaleObj = sales.find((s) => s.id === selectedSaleId);

  // Mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        sale_id: selectedSaleId,
        payment_method_id: paymentMethodId,
        amount,
        reference,
        notes
      };
      return (await api.post('/payments', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsRegisterModalOpen(false);
      setReference('');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestión de Cobranzas & Pagos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de cobros recibidos, amortizaciones y saldos pendientes por venta.
          </p>
        </div>
        <button
          onClick={() => {
            if (pendingSales.length > 0) {
              setSelectedSaleId(pendingSales[0].id);
              setAmount(Number(pendingSales[0].pending_balance));
            }
            setIsRegisterModalOpen(true);
          }}
          disabled={pendingSales.length === 0}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Cobro</span>
        </button>
      </div>

      {/* Pending balance banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ventas con Saldo Pendiente</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingSales.length} operaciones</h3>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Métodos de Cobro Habilitados</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {paymentMethods.map((m) => (
              <span key={m.id} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* List of pending sales needing payment */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 font-semibold text-xs text-slate-800">
          Estado de Cartera de Ventas
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4 text-right">Total Facturado</th>
                <th className="py-3 px-4 text-right">Cobrado</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.sale_code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{s.customer_name}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">${Number(s.total_amount).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">${Number(s.paid_amount).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600 font-bold">${Number(s.pending_balance).toFixed(2)}</td>
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
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {Number(s.pending_balance) > 0 && s.status === 'CONFIRMED' && (
                      <button
                        onClick={() => {
                          setSelectedSaleId(s.id);
                          setAmount(Number(s.pending_balance));
                          setIsRegisterModalOpen(true);
                        }}
                        className="text-sky-600 hover:text-sky-700 font-semibold text-xs px-2 py-1 rounded bg-sky-50"
                      >
                        Cobrar Saldo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Cobro */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Cobro en Caja</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerMutation.mutate();
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Venta Asociada</label>
                <select
                  value={selectedSaleId}
                  onChange={(e) => {
                    const sid = Number(e.target.value);
                    setSelectedSaleId(sid);
                    const s = sales.find((x) => x.id === sid);
                    if (s) setAmount(Number(s.pending_balance));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                >
                  {pendingSales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sale_code} - {s.customer_name} (Saldo: ${Number(s.pending_balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Método de Pago</label>
                  <select
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Importe a Cobrar ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedSaleObj ? Number(selectedSaleObj.pending_balance) : undefined}
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Referencia / Nro. Operación</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Voucher o Nro. de Transferencia bancaria"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 font-semibold text-white shadow-xs"
                >
                  {registerMutation.isPending ? 'Procesando...' : 'Registrar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
