import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, RefreshCw, LogOut, Building2 } from 'lucide-react';
import api from '../../services/api';

export const AccessRequestPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const pendingEmail = localStorage.getItem('salesia_pending_email') || 'tu correo registrado';
  const token = localStorage.getItem('salesia_token');

  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkStatus = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setChecking(true);
    setMessage(null);

    try {
      const res = await api.post('/auth/sesion', { access_token: token });
      if (res.data.estado === 'ACTIVO') {
        localStorage.setItem('salesia_user', JSON.stringify({
          id: res.data.usuario.id,
          email: res.data.usuario.correo_electronico,
          full_name: res.data.usuario.nombre_completo,
          role: res.data.usuario.roles[0] || 'VENDEDOR',
          roles: res.data.usuario.roles,
          permisos: res.data.usuario.permisos,
          company_id: res.data.usuario.empresa_id
        }));
        navigate('/dashboard');
      } else {
        setMessage('Tu solicitud continúa en estado de revisión por la administración.');
      }
    } catch {
      setMessage('Aún no se ha completado la aprobación de tu solicitud.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('salesia_token');
    localStorage.removeItem('salesia_user');
    localStorage.removeItem('salesia_pending_email');
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm z-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-900/30">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-400 text-xs font-semibold mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>SOLICITUD EN REVISIÓN</span>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight mb-2">
          Acceso Empresarial Pendiente
        </h1>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          La solicitud asociada a <span className="text-sky-400 font-mono font-medium">{pendingEmail}</span> está registrada en el sistema.
        </p>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs text-slate-400 space-y-2.5 mb-6">
          <div className="flex items-center gap-2 text-slate-200 font-medium">
            <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>SalesIA Tech Solutions S.A.C.</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Por estrictas políticas de seguridad corporativa y control de acceso (RBAC), ninguna cuenta nueva posee acceso a módulos de ventas, inventario o reportes hasta que un <strong>Administrador</strong> autorice la solicitud y te asigne tus roles correspondientes.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protección contra elevación no autorizada de privilegios</span>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-2.5 rounded-lg bg-slate-800/80 text-xs text-slate-300 animate-in fade-in">
            {message}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-lg text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Comprobando...' : 'Comprobar Estado de Aprobación'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
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
