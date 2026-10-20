import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserCheck, Target, Award, DollarSign, Mail, Phone, Calendar } from 'lucide-react';
import { getEmployees, getEmployeePerformance } from '../../services/mockDataService';
import { Employee, EmployeePerformance } from '../../types';

export const EmployeesPage: React.FC = () => {
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => await getEmployees()
  });

  const { data: performance } = useQuery<EmployeePerformance>({
    queryKey: ['employeePerformance', selectedEmpId],
    queryFn: async () => {
      if (!selectedEmpId) return undefined as any;
      const res = await getEmployeePerformance(selectedEmpId);
      return res as EmployeePerformance;
    },
    enabled: selectedEmpId !== null
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Personal & Fuerza de Ventas</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Control de colaboradores, metas comerciales y comisiones calculadas sobre ventas confirmadas.
        </p>
      </div>

      {/* Grid of employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Cargando personal...</div>
        ) : (
          employees.map((e) => (
            <div
              key={e.id}
              onClick={() => setSelectedEmpId(e.id)}
              className={`p-4 bg-white border rounded-xl shadow-xs cursor-pointer transition-all ${
                selectedEmpId === e.id
                  ? 'border-sky-500 ring-2 ring-sky-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 font-bold flex items-center justify-center text-sm">
                  {e.first_name[0]}{e.last_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{e.first_name} {e.last_name}</h3>
                  <p className="text-[11px] text-slate-400">{e.job_title}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Meta Mensual:</span>
                  <span className="font-mono font-semibold">${Number(e.monthly_sales_target).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tasa Comisión:</span>
                  <span className="font-mono font-semibold">{(Number(e.commission_rate) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Contacto:</span>
                  <span>{e.phone || e.email}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 text-center text-[11px] font-semibold text-sky-600 hover:text-sky-700">
                Ver Métricas de Desempeño →
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Employee Performance Card */}
      {performance && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Desempeño Comercial: {performance.first_name} {performance.last_name}
              </h3>
              <p className="text-xs text-slate-500">{performance.job_title} • Meta: ${Number(performance.monthly_sales_target).toLocaleString()}</p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Cumplimiento: {Number(performance.target_fulfillment_pct).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
              <p className="text-xs text-slate-400">Ventas Válidas</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">{performance.total_sales_count} ops.</h4>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl text-center border border-sky-100">
              <p className="text-xs text-slate-500">Volumen Facturado</p>
              <h4 className="text-xl font-bold text-sky-900 mt-1">${Number(performance.total_sales_amount).toLocaleString()}</h4>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-100">
              <p className="text-xs text-slate-500">Comisiones Ganadas</p>
              <h4 className="text-xl font-bold text-emerald-900 mt-1">${Number(performance.total_commission_earned).toLocaleString()}</h4>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-center border border-purple-100">
              <p className="text-xs text-slate-500">Avance de Meta</p>
              <h4 className="text-xl font-bold text-purple-900 mt-1">{Number(performance.target_fulfillment_pct).toFixed(1)}%</h4>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
