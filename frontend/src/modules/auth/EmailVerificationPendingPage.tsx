import React from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, ArrowRight, ShieldAlert } from 'lucide-react';

export const EmailVerificationPendingPage: React.FC = () => {
  const pendingEmail = localStorage.getItem('salesia_pending_email') || 'tu correo registrado';

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm z-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-950/80 border border-sky-800/80 text-sky-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-900/30">
          <MailCheck className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight mb-2">
          Verifica tu Correo Electrónico
        </h1>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Hemos enviado un enlace de confirmación a:
          <br />
          <span className="font-semibold text-sky-400 font-mono mt-1 inline-block">{pendingEmail}</span>
        </p>

        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs text-slate-400 space-y-2 mb-6">
          <div className="flex items-center gap-2 text-slate-200 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Siguiente Paso Requerido:</span>
          </div>
          <p className="text-[11px] leading-normal">
            1. Abre tu bandeja de entrada o carpeta de spam.
            <br />
            2. Haz clic en el enlace de verificación de Supabase.
            <br />
            3. Una vez confirmado, tu solicitud será evaluada por un administrador para la asignación de tus roles de acceso.
          </p>
        </div>

        <Link
          to="/login"
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-lg text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
        >
          <span>Ir a Iniciar Sesión</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default EmailVerificationPendingPage;
