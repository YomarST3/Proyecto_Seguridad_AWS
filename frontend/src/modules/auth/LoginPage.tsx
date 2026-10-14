import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BadgeDollarSign,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import supabase from '../../services/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Paso 1: Correo / Paso 2: Contraseña
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('admin@salesia.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal para recuperar contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // --------------------------------------------------------------------------
  // PASO 1: VALIDACIÓN DE CORREO (ANTI-ENUMERACIÓN)
  // --------------------------------------------------------------------------
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación básica de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor introduce un correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      // Endpoint anti-enumeración en FastAPI
      await api.post('/auth/verificar-correo', { correo: email.trim() });
      setStep(2);
    } catch (err: any) {
      // Ante cualquier eventualidad, avanza a paso 2 sin revelar si existe
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // PASO 2: AUTENTICACIÓN CON SUPABASE AUTH & FASTAPI
  // --------------------------------------------------------------------------
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Autenticación oficial directa con Supabase Auth (GoTrue)
      let accessToken: string | null = null;
      try {
        const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (supaError) {
          const msg = supaError.message.toLowerCase();
          if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
            setError('Correo electrónico o contraseña incorrectos.');
          } else if (msg.includes('email not confirmed')) {
            setError('Tu correo electrónico no ha sido verificado. Por favor revisa tu bandeja de entrada o spam.');
          } else {
            setError('Credenciales incorrectas o cuenta no autorizada.');
          }
          setLoading(false);
          return;
        }

        if (supaData?.session?.access_token) {
          accessToken = supaData.session.access_token;
        }
      } catch (networkErr: any) {
        // En caso de corte total de red con Supabase en desarrollo local
        try {
          const localLogin = await api.post('/auth/login', {
            email: email.trim(),
            password: password,
          });
          accessToken = localLogin.data.access_token;
        } catch {
          setError('No fue posible conectar con el servidor de autenticación de Supabase.');
          setLoading(false);
          return;
        }
      }

      if (!accessToken) {
        setError('No se pudo obtener el token de acceso desde Supabase Auth.');
        setLoading(false);
        return;
      }

      // 2. Validar criptográficamente el token y consultar claims empresariales en FastAPI
      const sessionRes = await api.post('/auth/sesion', { access_token: accessToken });
      const { estado, mensaje, usuario } = sessionRes.data;

      if (estado === 'SOLICITUD_PENDIENTE') {
        localStorage.setItem('salesia_pending_email', email.trim());
        navigate('/pendiente-aprobacion');
        return;
      }

      if (estado === 'SIN_ROLES') {
        setError('Tu cuenta está confirmada pero aún no cuenta con ningún rol empresarial autorizado. Contacta a un administrador.');
        return;
      }

      if (estado === 'RECHAZADA') {
        setError('Tu solicitud de acceso fue rechazada por la administración de la empresa.');
        return;
      }

      if (estado === 'INACTIVO') {
        setError('Tu cuenta de usuario ha sido desactivada por un administrador corporativo.');
        return;
      }

      if (estado === 'NO_REGISTRADO') {
        setError('Tu cuenta existe en Supabase pero no tiene una solicitud ni registro en esta empresa.');
        return;
      }

      if (estado === 'ACTIVO' && usuario && accessToken) {
        // Guardar sesión y claims de roles/permisos
        localStorage.setItem('salesia_token', accessToken);
        localStorage.setItem('salesia_user', JSON.stringify({
          id: usuario.id,
          email: usuario.correo_electronico,
          full_name: usuario.nombre_completo,
          role: usuario.roles[0] || 'VENDEDOR',
          roles: usuario.roles,
          permisos: usuario.permisos,
          company_id: usuario.empresa_id
        }));

        // Redirección según matriz de roles autorizados (Sección 8):
        const roles = usuario.roles || [];
        if (roles.includes('ADMINISTRADOR') || roles.includes('ADMIN')) {
          navigate('/dashboard');
        } else if (roles.includes('GERENTE') || roles.includes('MANAGER')) {
          navigate('/dashboard');
        } else if (roles.includes('VENDEDOR') || roles.includes('SELLER')) {
          navigate('/customers');
        } else if (roles.includes('ANALISTA') || roles.includes('ANALYST')) {
          navigate('/analytics');
        } else if (roles.includes('ALMACEN') || roles.includes('WAREHOUSE')) {
          navigate('/inventory');
        } else {
          navigate('/dashboard');
        }
        return;
      }

      setError(mensaje || 'No se pudo verificar la sesión empresarial.');

    } catch (err: any) {
      // Errores genéricos y seguros (anti-enumeración)
      const detail = err.response?.data?.detail;
      setError(detail || 'Credenciales incorrectas o cuenta no autorizada.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // RECUPERACIÓN DE CONTRASEÑA
  // --------------------------------------------------------------------------
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });
      setResetSent(true);
    } catch {
      // Mostrar éxito de forma segura siempre
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/20 mb-3">
            <BadgeDollarSign className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-1.5">
            SalesIA <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 font-semibold tracking-wider">Enterprise</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Autenticación Empresarial & Acceso por Roles</p>
        </div>

        {/* Indicador de 2 Pasos */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            step === 1 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-slate-800 text-slate-400'
          }`}>
            <span>1</span>
            <span>Correo</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-800"></div>
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            step === 2 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-slate-800 text-slate-400'
          }`}>
            <span>2</span>
            <span>Contraseña</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* -------------------- FORMULARIO PASO 1 -------------------- */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="colaborador@empresa.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full mt-2 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Validando...</span>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* -------------------- FORMULARIO PASO 2 -------------------- */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            {/* Visualización de correo con opción de cambio */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-slate-300 font-medium truncate">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => { setStep(1); setError(null); }}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium shrink-0 ml-2"
              >
                Cambiar
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => { setResetEmail(email); setShowResetModal(true); }}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep(1); setError(null); }}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Atrás</span>
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="w-2/3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Verificando...</span>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Enlace para Crear Cuenta */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400">
            ¿No tienes acceso empresarial?{' '}
            <Link to="/registro" className="text-sky-400 hover:text-sky-300 font-semibold">
              Crear cuenta
            </Link>
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Seguridad criptográfica respaldada por Supabase Auth</span>
          </div>
        </div>
      </div>

      {/* -------------------- MODAL RECUPERACIÓN DE CONTRASEÑA -------------------- */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-base font-bold text-white mb-1.5">Recuperación de Contraseña</h2>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa tu correo empresarial para recibir un enlace seguro de restablecimiento de contraseña vía Supabase.
            </p>

            {resetSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Si la cuenta existe, recibirás instrucciones para restablecer tu contraseña en breve.
                </p>
                <button
                  onClick={() => { setShowResetModal(false); setResetSent(false); }}
                  className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium py-2 rounded-lg"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Correo
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="colaborador@empresa.com"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail}
                    className="w-1/2 bg-sky-600 hover:bg-sky-500 text-white text-xs py-2 rounded-lg disabled:opacity-50"
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar Enlace'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
