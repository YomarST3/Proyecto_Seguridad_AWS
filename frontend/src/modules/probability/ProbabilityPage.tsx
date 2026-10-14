import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Percent, Calculator, Sparkles, BookOpen, AlertCircle, ArrowRight, Dna } from 'lucide-react';
import api from '../../services/api';

export const ProbabilityPage: React.FC = () => {
  // Bayes form state
  const [eventAName, setEventAName] = useState('Cliente recompra producto premium');
  const [eventBName, setEventBName] = useState('Cliente recibió descuento > 10%');
  const [priorA, setPriorA] = useState<number>(0.20);
  const [likelihoodBgivenA, setLikelihoodBgivenA] = useState<number>(0.75);
  const [marginalB, setMarginalB] = useState<number>(0.35);

  const [bayesResult, setBayesResult] = useState<any>(null);
  const [bayesError, setBayesError] = useState<string | null>(null);

  // Random variable state
  const [rvSample, setRvSample] = useState('1, 2, 1, 3, 2, 2, 4, 1, 2, 3, 1, 2, 5');
  const [rvResult, setRvResult] = useState<any>(null);

  // Bayes mutation
  const bayesMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        event_a_name: eventAName,
        event_b_name: eventBName,
        prior_prob_a: priorA,
        likelihood_b_given_a: likelihoodBgivenA,
        marginal_prob_b: marginalB
      };
      return (await api.post('/probability/bayes', payload)).data;
    },
    onSuccess: (data) => {
      setBayesResult(data);
      setBayesError(null);
    },
    onError: (err: any) => {
      setBayesError(err.response?.data?.detail || 'Error en el cálculo bayesiano.');
      setBayesResult(null);
    }
  });

  // Random variable mutation
  const rvMutation = useMutation({
    mutationFn: async () => {
      const numbers = rvSample
        .split(',')
        .map((x) => parseFloat(x.trim()))
        .filter((x) => !isNaN(x));

      const payload = {
        observations: numbers,
        variable_name: 'Artículos por Venta',
        variable_type: 'QUANTITATIVE_DISCRETE'
      };
      return (await api.post('/random-variables/analyze', payload)).data;
    },
    onSuccess: (data) => {
      setRvResult(data);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Probabilidades & Teorema de Bayes</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Fundamentos probabilísticos de la Semana 07: Inferencia bayesiana y modelado de variables aleatorias discretas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Teorema de Bayes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Percent className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-900">Calculadora del Teorema de Bayes</h3>
          </div>

          <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-900 font-mono text-center">
            P(A | B) = [ P(B | A) × P(A) ] / P(B)
          </div>

          {bayesError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bayesError}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Evento A (Hipótesis)</label>
              <input
                type="text"
                value={eventAName}
                onChange={(e) => setEventAName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Evento B (Evidencia Observada)</label>
              <input
                type="text"
                value={eventBName}
                onChange={(e) => setEventBName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">P(A) [A priori]</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={priorA}
                  onChange={(e) => setPriorA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">P(B | A) [Verosimilitud]</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={likelihoodBgivenA}
                  onChange={(e) => setLikelihoodBgivenA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">P(B) [Marginal]</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  max="1"
                  value={marginalB}
                  onChange={(e) => setMarginalB(parseFloat(e.target.value) || 0.001)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs"
                />
              </div>
            </div>

            <button
              onClick={() => bayesMutation.mutate()}
              disabled={bayesMutation.isPending}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              <span>{bayesMutation.isPending ? 'Calculando...' : 'Calcular P(A | B)'}</span>
            </button>
          </div>

          {/* Bayes Result & Algebraic Steps */}
          {bayesResult && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-700">Probabilidad a Posteriori:</span>
                <span className="text-lg font-bold text-sky-600 font-mono">
                  {(bayesResult.posterior_prob_a_given_b * 100).toFixed(2)}% ({bayesResult.posterior_prob_a_given_b})
                </span>
              </div>

              <div>
                <h5 className="font-semibold text-slate-700 mb-1">Procedimiento Desglosado:</h5>
                <pre className="p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
                  {bayesResult.calculation_steps}
                </pre>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed text-[11px]">
                <strong>Interpretación:</strong> {bayesResult.verbal_interpretation}
              </div>
            </div>
          )}
        </div>

        {/* Module 2: Variable Aleatoria Discreta */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Dna className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-sm text-slate-900">Distribución de Variable Aleatoria Discreta</h3>
          </div>

          <p className="text-xs text-slate-500">
            Modela variables cuantitativas discretas comerciales (e.g. número de unidades vendidas por transacción).
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Muestra Observada (Valores separados por coma)</label>
              <input
                type="text"
                value={rvSample}
                onChange={(e) => setRvSample(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>

            <button
              onClick={() => rvMutation.mutate()}
              disabled={rvMutation.isPending}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              <span>{rvMutation.isPending ? 'Analizando...' : 'Calcular Soporte & E[X]'}</span>
            </button>
          </div>

          {rvResult && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-700">Valor Esperado E[X]:</span>
                <span className="text-base font-bold text-cyan-700 font-mono">
                  {rvResult.expected_value} unidades
                </span>
              </div>

              <div>
                <h5 className="font-semibold text-slate-700 mb-1.5">Distribución de Probabilidad P(X = x):</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase">
                        <th className="py-1.5">Valor (x)</th>
                        <th className="py-1.5 text-center">Frecuencia</th>
                        <th className="py-1.5 text-right">P(X = x)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rvResult.distribution?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-1.5 font-mono font-semibold text-slate-800">{item.value}</td>
                          <td className="py-1.5 text-center font-mono text-slate-600">{item.frequency}</td>
                          <td className="py-1.5 text-right font-mono font-bold text-cyan-600">
                            {(item.probability * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
