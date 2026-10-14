import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, Eye, Building2, User, Phone, Mail, MapPin, DollarSign, ShoppingBag, X } from 'lucide-react';
import api from '../../services/api';
import { Customer } from '../../types';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_type: 'NATURAL' as 'NATURAL' | 'JURIDICA',
    full_name: '',
    doc_type: 'DNI',
    doc_number: '',
    email: '',
    phone: '',
    address: ''
  });

  // Query list
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { search: searchTerm } });
      return res.data;
    }
  });

  // Query detail
  const { data: customerDetail, isLoading: isLoadingDetail } = useQuery<Customer>({
    queryKey: ['customerDetail', selectedCustomerId],
    queryFn: async () => {
      const res = await api.get(`/customers/${selectedCustomerId}`);
      return res.data;
    },
    enabled: selectedCustomerId !== null
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/customers', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateModalOpen(false);
      setFormData({
        customer_type: 'NATURAL',
        full_name: '',
        doc_type: 'DNI',
        doc_number: '',
        email: '',
        phone: '',
        address: ''
      });
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Directorio de Clientes</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión demográfica e historial de compra derivado de operaciones comerciales.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Cliente</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, documento o correo..."
          className="w-full text-xs bg-transparent border-none focus:outline-none placeholder-slate-400 text-slate-800"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Nombre / Razón Social</th>
                <th className="py-3 px-4">Documento</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Cargando clientes...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No se encontraron clientes registrados.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.customer_type === 'JURIDICA'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {c.customer_type === 'JURIDICA' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span>{c.customer_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.full_name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{c.doc_type}: {c.doc_number}</td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>{c.email || '—'}</div>
                      <div className="text-[11px] text-slate-400">{c.phone || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Activo
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomerId(c.id)}
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold text-xs p-1 rounded hover:bg-sky-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Ficha</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ficha de Cliente (Rule Section 4) */}
      {selectedCustomerId && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Ficha Comercial del Cliente</h3>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingDetail || !customerDetail ? (
              <div className="py-12 text-center text-xs text-slate-400">Cargando ficha comercial...</div>
            ) : (
              <div className="space-y-4">
                {/* Header info */}
                <div>
                  <h4 className="font-bold text-base text-slate-900">{customerDetail.full_name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {customerDetail.doc_type} • {customerDetail.doc_number} • Tipo: {customerDetail.customer_type}
                  </p>
                </div>

                {/* Contact data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{customerDetail.email || 'No registrado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{customerDetail.phone || 'No registrado'}</span>
                  </div>
                  <div className="sm:col-span-2 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{customerDetail.address || 'Sin dirección registrada'}</span>
                  </div>
                </div>

                {/* Commercial KPIs (calculated from sales, not stored manually) */}
                <div>
                  <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Historial Comercial Calculado
                  </h5>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-sky-50/70 border border-sky-100 text-center">
                      <ShoppingBag className="w-4 h-4 text-sky-600 mx-auto mb-1" />
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Compras</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{customerDetail.total_purchases_count || 0}</p>
                    </div>

                    <div className="p-2 sm:p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-center">
                      <DollarSign className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Total</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">${Number(customerDetail.total_amount_spent || 0).toLocaleString()}</p>
                    </div>

                    <div className="p-2 sm:p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-center">
                      <DollarSign className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Promedio</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">${Number(customerDetail.average_ticket || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center pt-2">
                  Última compra registrada: {customerDetail.last_purchase_date ? new Date(customerDetail.last_purchase_date).toLocaleDateString() : 'Sin compras'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Registrar Cliente */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Cliente</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo de Cliente</label>
                  <select
                    value={formData.customer_type}
                    onChange={(e: any) => setFormData({ ...formData, customer_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="NATURAL">Persona Natural</option>
                    <option value="JURIDICA">Persona Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo Documento</label>
                  <select
                    value={formData.doc_type}
                    onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="PASSPORT">Pasaporte</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Número de Documento</label>
                <input
                  type="text"
                  required
                  value={formData.doc_number}
                  onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                  placeholder="Número de DNI / RUC"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre Completo / Razón Social</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Razón social o nombre del cliente"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+51 987 654 321"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Av. Principal 123"
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
                  {createMutation.isPending ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
