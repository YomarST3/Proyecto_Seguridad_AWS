import React from 'react';
import { Settings, ShieldCheck, Building2, Key, Database, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const roles = [
    { name: 'ADMIN', desc: 'Control total de configuración, roles y auditoría sensible' },
    { name: 'MANAGER', desc: 'Supervisión comercial, reportes ejecutivos y metas' },
    { name: 'SALESPERSON', desc: 'Gestión de clientes, pedidos y ventas asignadas' },
    { name: 'ANALYST', desc: 'Exploración de datos, motor de probabilidades y modelos estadísticos' },
    { name: 'WAREHOUSE', desc: 'Control de existencias físicas y registro de movimientos de inventario' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Configuración & Seguridad</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Parámetros globales de la organización, roles RBAC y auditoría transaccional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-900">Datos Corporativos de la Empresa</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Razón Social</label>
              <input
                type="text"
                disabled
                value="SalesIA Tech Solutions S.A.C."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">RUC / Identificador Fiscal</label>
                <input
                  type="text"
                  disabled
                  value="20608912345"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Moneda Operativa</label>
                <input
                  type="text"
                  disabled
                  value="USD (Dólares Americanos)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Impuesto a las Ventas (Tax Rate)</label>
                <input
                  type="text"
                  disabled
                  value="18.00% (IGV)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Aislamiento Multi-Tenant</label>
                <input
                  type="text"
                  disabled
                  value="company_id = 1 (Activo)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-emerald-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RBAC Roles */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Matriz de Roles & Permisos (RBAC)</h3>
          </div>

          <div className="space-y-2.5">
            {roles.map((r) => (
              <div key={r.name} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 font-mono text-[11px]">{r.name}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
