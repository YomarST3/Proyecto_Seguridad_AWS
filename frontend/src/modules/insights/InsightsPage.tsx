import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, AlertTriangle, AlertCircle, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { Insight } from '../../types';

export const InsightsPage: React.FC = () => {
  const { data: insights = [], isLoading } = useQuery<Insight[]>({
    queryKey: ['insights'],
    queryFn: async () => (await api.get('/insights')).data
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Insights & Alertas Comerciales</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Observaciones automáticas fundamentadas en reglas estadísticas transparentes y evidencia cuantitativa verificable.
        </p>
      </div>

      {/* Info card */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-xs text-sky-900 leading-relaxed">
          <strong>Lógica Determinista y Explicable:</strong> Cada insight indica su regla formal de activación y su respaldo numérico exacto en la base de datos PostgreSQL, garantizando reproducibilidad sin sesgos.
        </p>
      </div>

      {/* Grid of insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Evaluando reglas estadísticas...</div>
        ) : insights.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">No se detectaron anomalías o alertas en los datos actuales.</div>
        ) : (
          insights.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-xl border bg-white shadow-xs space-y-3.5 transition-all ${
                item.severity === 'CRITICAL'
                  ? 'border-rose-200 border-l-4 border-l-rose-500'
                  : item.severity === 'WARNING'
                  ? 'border-amber-200 border-l-4 border-l-amber-500'
                  : item.severity === 'OPPORTUNITY'
                  ? 'border-cyan-200 border-l-4 border-l-cyan-500'
                  : 'border-slate-200 border-l-4 border-l-sky-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.severity === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-700'
                    : item.severity === 'WARNING'
                    ? 'bg-amber-50 text-amber-700'
                    : item.severity === 'OPPORTUNITY'
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'bg-sky-50 text-sky-700'
                }`}>
                  {item.severity}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{item.period}</span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg space-y-1 text-[11px] font-mono text-slate-600 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Condición:</span>
                  <span className="font-semibold text-slate-700">{item.condition_rule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Evidencia:</span>
                  <span className="font-bold text-slate-900">{item.evidence_value}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
