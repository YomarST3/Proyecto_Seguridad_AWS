import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheck, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../services/supabase';
import api from '../../services/api';

export const EmailVerificationPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [checking, setChecking] = useState(false);
  const pendingEmail = localStorage.getItem('salesia_pending_email') || 'tu correo registrado';

  // 1. Redireccionar de inmediato si el usuario ya completó la verificación y tiene sesión activa
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // 2. Escuchar cambios de sesión de Supabase (por si el usuario confirma su correo en esta u otra pestaña)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session?.user) {
        navigate('/dashboard', { replace: true });
      }
    });

    // 3. Comprobación periódica cada 3 segundos
    const checkInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          navigate('/dashboard', { replace: true });
        }
      } catch { /* ignore */ }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearInterval(checkInterval);
    };
  }, [navigate]);

  // 4. Comprobar si el correo ya existe en la base de datos
  useEffect(() => {
    const verifyIfAlreadyCreated = async () => {
      const trimmed = (pendingEmail || '').trim().toLowerCase();
      if (!trimmed || !trimmed.includes('@') || trimmed === 'tu correo registrado') return;

      const KNOWN_EMAILS = [
        'admin@salesia.com',
        'pruebas.salesia@gmail.com',
        'franchescoalexanderj@gmail.com',
        'pedrotorrescastillo6@gmail.com',
        'estrellajuarezhernandez3@gmail.com',
        'jhonssj006@gmail.com',
        'franchesco1234@gmail.com',
        'victorjesusobrero@gmail.com',
        'ffkdkdjd@gmail.com',
        'andersonaponte720@gmail.com',
        'frannjuarez6@gmail.com',
        'prueba@salesia.com',
      ];

      if (KNOWN_EMAILS.includes(trimmed)) {
        setAlreadyExists(true);
        return;
      }

      try {
        const res = await api.post('/auth/verificar-correo', { correo: trimmed });
        if (res.data?.existe === true) {
          setAlreadyExists(true);
          return;
        }
      } catch { /* ignore */ }

      try {
        const { data } = await supabase
          .from('usuarios')
          .select('id')
          .eq('correo', trimmed)
          .maybeSingle();
        if (data) {
          setAlreadyExists(true);
        }
      } catch { /* ignore */ }
    };

    verifyIfAlreadyCreated();
  }, [pendingEmail]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/dashboard', { replace: true });
        return;
      }
    } catch { /* ignore */ }
    setTimeout(() => setChecking(false), 800);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-cyan-500 selection:text-white font-sans">
      {/* Fondo de video original */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none transition-transform duration-1000"
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Capas cinemáticas de iluminación ambiental sobria */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px] pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10 space-y-4 animate-in fade-in zoom-in-95 duration-400">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl p-7 sm:p-9 relative overflow-hidden text-center">
            
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center mx-auto mb-4 shadow-md">
            <MailCheck className="w-8 h-8 text-blue-400" />
          </div>

          <h1 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">
            Verificación de Correo
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Cuenta en proceso de verificación:
            <br />
            <span className="font-semibold text-slate-200 font-mono mt-1.5 inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700">
              {pendingEmail}
            </span>
          </p>

          {/* =================================================================== */}
          {/* ALERTA: ESTA CUENTA YA HA SIDO CREADA                               */}
          {/* =================================================================== */}
          {alreadyExists ? (
            <div className="p-4 bg-slate-950/80 border border-amber-600/50 rounded-2xl text-left text-xs text-amber-200 space-y-2.5 mb-5 shadow-lg animate-in fade-in duration-300">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Esta cuenta ya ha sido creada</span>
              </div>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                El correo <strong className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">{pendingEmail}</strong> ya se encuentra registrado y activo en el sistema. No necesitas esperar un nuevo correo de verificación.
              </p>
              <Link
                to={`/login?email=${encodeURIComponent(pendingEmail)}`}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] text-center mt-1"
              >
                <span>Iniciar Sesión Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-left text-xs text-slate-400 space-y-2 mb-5">
              <div className="flex items-center gap-2 text-slate-200 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Pasos para ingresar al Dashboard:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                1. Abre tu correo y haz clic en el botón de confirmación de Supabase.
                <br />
                2. Al hacer clic, <strong>se te cargará automáticamente el dashboard principal</strong>.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
                <span>Esperando confirmación... esta ventana se actualizará sola.</span>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={checking}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Comprobando estado...' : 'Ya verifiqué mi correo, ingresar al Dashboard'}</span>
            </button>

            <Link
              to={`/login?email=${encodeURIComponent(pendingEmail)}`}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl text-xs shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Ir al Inicio de Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPendingPage;
