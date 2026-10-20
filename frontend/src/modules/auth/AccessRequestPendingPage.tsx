import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, RefreshCw, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AccessRequestPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, signOut } = useAuth();
  const pendingEmail = localStorage.getItem('salesia_pending_email') || 'tu correo registrado';

  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkStatus = async () => {
    setChecking(true);
    setMessage(null);

    try {
      await refreshProfile();
      if (user) {
        navigate('/dashboard');
      } else {
        setMessage('Tu solicitud continúa en proceso de validación corporativa.');
      }
    } catch {
      setMessage('Aún no se ha completado la aprobación de tu solicitud.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 sm:p-6 relative selection:bg-zinc-800 selection:text-white">
      {/* Background accents */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '36px 36px'
        }}
      />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-zinc-800/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-7 sm:p-8 backdrop-blur-md z-10 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center mx-auto shadow-md">
          <Clock className="w-7 h-7 text-zinc-300 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
          <span>Solicitud en Proceso</span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Acceso Empresarial Pendiente
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            La solicitud vinculada a <span className="text-zinc-200 font-mono font-medium">{pendingEmail}</span> está registrada.
          </p>
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl text-left text-xs text-zinc-400 space-y-2.5">
          <div className="flex items-center gap-2 text-zinc-200 font-medium">
            <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>SalesIA Enterprise Suite</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Bajo las políticas de control de acceso corporativo (RBAC), ninguna cuenta nueva posee acceso a módulos operacionales hasta que un <strong>Administrador</strong> valide la credencial y asigne los permisos pertinentes.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 pt-2 border-t border-zinc-900">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
            <span>Segregación estricta de funciones y roles comerciales</span>
          </div>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 animate-in fade-in">
            {message}
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Comprobando autorización...' : 'Comprobar Estado de Aprobación'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-medium py-2 rounded-xl text-xs border border-zinc-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessRequestPendingPage;

