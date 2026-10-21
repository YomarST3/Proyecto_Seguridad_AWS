import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Volume1, Sparkles, RotateCcw, Sliders } from 'lucide-react';
import { useVoiceAssistant } from '../contexts/VoiceAssistantContext';

interface VoiceAssistantControlProps {
  compact?: boolean;
}

export const VoiceAssistantControl: React.FC<VoiceAssistantControlProps> = ({ compact = false }) => {
  const { isEnabled, volume, isPlaying, toggleEnabled, setVolume, replayLast, stopAll } = useVoiceAssistant();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const volumePct = Math.round(volume * 100);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Botón Principal con diseño corporativo blanco y tipografía oscura */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none ${
          isPlaying ? 'ring-2 ring-blue-500/30 border-blue-400' : ''
        }`}
        title="Control de Voz del Asistente"
      >
        <div className="relative flex items-center">
          {!isEnabled ? (
            <VolumeX className="w-4 h-4 text-slate-400" />
          ) : volume === 0 ? (
            <VolumeX className="w-4 h-4 text-slate-500" />
          ) : volume < 0.5 ? (
            <Volume1 className="w-4 h-4 text-blue-600" />
          ) : (
            <Volume2 className="w-4 h-4 text-blue-600" />
          )}

          {/* Indicador de audio reproduciéndose */}
          {isPlaying && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
          )}
        </div>

        {!compact && (
          <span className="hidden sm:inline">
            {!isEnabled ? 'Voz Desactivada' : isPlaying ? 'Hablando...' : `Voz ${volumePct}%`}
          </span>
        )}
      </button>

      {/* Popover de Configuración de Volumen y Estado */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-bold text-xs text-slate-900">Voz del Asistente</span>
            </div>
            {isPlaying && (
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                En Vivo
              </span>
            )}
          </div>

          {/* Interruptor Encender / Apagar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Asistente Activo</span>
            <button
              type="button"
              onClick={toggleEnabled}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Slider de Volumen */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Volumen</span>
              <span className="font-mono text-slate-900 font-bold">{volumePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              disabled={!isEnabled}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer disabled:opacity-40 h-1.5 bg-slate-200 rounded-lg appearance-none"
            />
          </div>

          {/* Acciones Secundarias */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
            <button
              type="button"
              onClick={() => {
                replayLast();
              }}
              disabled={!isEnabled}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-600" />
              <span>Repetir Saludo</span>
            </button>

            {isPlaying && (
              <button
                type="button"
                onClick={stopAll}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-200 cursor-pointer transition-colors"
              >
                Silenciar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
