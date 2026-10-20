import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../services/supabase';
import api from '../../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // Paso 1: Correo / Paso 2: Contraseña
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotRegistered, setEmailNotRegistered] = useState(false);

  // Modal para recuperar contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // --------------------------------------------------------------------------
  // PASO 1: VERIFICAR SI EL CORREO EXISTE EN LA BASE DE DATOS
  // --------------------------------------------------------------------------
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailNotRegistered(false);

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Por favor ingresa un correo electrónico corporativo válido.');
      return;
    }

    setLoading(true);

    try {
      // 1. Cuentas maestras y de prueba conocidas siempre válidas
      if (
        emailTrimmed === 'pruebas.salesia@gmail.com' ||
        emailTrimmed === 'admin@salesia.com' ||
        emailTrimmed === 'prueba@salesia.com' ||
        emailTrimmed.includes('admin')
      ) {
        setStep(2);
        setLoading(false);
        return;
      }

      // 2. Consultar endpoint de verificación en base de datos
      let existe = false;
      try {
        const res = await api.post('/auth/verificar-correo', { correo: emailTrimmed });
        if (res.data?.existe === true) {
          existe = true;
        } else if (res.data?.existe === false) {
          existe = false;
        }
      } catch {
        // Fallback: verificar si existe en tabla usuarios / solicitudes_acceso de Supabase
        try {
          const { data: userRow } = await supabase
            .from('usuarios')
            .select('id')
            .eq('correo', emailTrimmed)
            .maybeSingle();

          if (userRow) {
            existe = true;
          }
        } catch {
          // Si no es posible conectar, permitir el paso para que GoTrue valide
          existe = true;
        }
      }

      if (!existe) {
        setEmailNotRegistered(true);
        setLoading(false);
        return;
      }

      // Correo verificado con éxito, avanzar al paso de contraseña
      setStep(2);
    } catch {
      setError('No fue posible validar el correo en este momento. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // PASO 2: INICIO DE SESIÓN CON CONTRASEÑA EN SUPABASE AUTH
  // --------------------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Por favor ingresa tu contraseña de acceso.');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email.trim(), password);

      if (!result.success) {
        setError(result.error || 'Contraseña incorrecta o credenciales no válidas.');
        setLoading(false);
        return;
      }

      navigate(result.redirectTo || '/dashboard');
    } catch {
      setError('No fue posible procesar el inicio de sesión. Verifica tu conexión.');
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
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-neutral-900 selection:text-white">
      {/* ========================================================================= */}
      {/* FONDO DE VIDEO ANIMADO (13495-248644905.mp4)                              */}
      {/* ========================================================================= */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none transition-transform duration-1000"
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Overlay oscuro y de cristal minimalista para legibilidad y elegancia */}
      <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80 pointer-events-none" />

      {/* ========================================================================= */}
      {/* TARJETA MINIMALISTA DE INICIO DE SESIÓN                                   */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md relative z-10 space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-7 sm:p-9 transition-all">
          {/* Identidad / Logotipo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-900/30 mb-3.5 transition-transform hover:scale-105">
              <Building2 className="w-6 h-6 text-neutral-100" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              SalesIA <span className="font-light text-neutral-500">Enterprise</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Plataforma de Analítica & Gestión Comercial
            </p>
          </div>

          {/* Indicador de pasos minimalista */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
              step === 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}>
              <span>1</span>
              <span>Correo</span>
            </div>
            <div className="w-6 h-0.5 bg-neutral-200"></div>
            <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
              step === 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400'
            }`}>
              <span>2</span>
              <span>Contraseña</span>
            </div>
          </div>

          {/* Alerta general de error */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}

          {/* -------------------- PASO 1: FORMULARIO DE CORREO -------------------- */}
          {step === 1 && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 tracking-wide">
                  Correo Electrónico Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailNotRegistered(false);
                      setError(null);
                    }}
                    className={`w-full bg-neutral-50/90 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white transition-all ${
                      emailNotRegistered
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10'
                    }`}
                    placeholder="usuario@empresa.com"
                  />
                </div>

                {/* ALERTA PEQUEÑA ABAJO DEL CORREO SI NO EXISTE EN LA BD */}
                {emailNotRegistered && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2 mt-1.5 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span>Este correo aún no está registrado, por favor crearse una cuenta.</span>
                      <div className="mt-1">
                        <Link
                          to="/registro"
                          className="font-bold underline text-red-800 hover:text-red-900 inline-flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Crear una cuenta aquí</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full mt-2 bg-neutral-900 hover:bg-black text-white font-medium py-3 px-4 rounded-xl text-sm shadow-md shadow-neutral-900/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                    <span>Verificando correo...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* -------------------- PASO 2: FORMULARIO DE CONTRASEÑA -------------------- */}
          {step === 2 && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-200">
              {/* Badge de correo validado con opción de cambio */}
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-neutral-100 border border-neutral-200/80 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Mail className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                  <span className="text-neutral-800 font-medium truncate">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                    setPassword('');
                  }}
                  className="text-[11px] text-neutral-900 hover:underline font-semibold shrink-0 ml-2 cursor-pointer"
                >
                  Cambiar
                </button>
              </div>

              {/* Input Contraseña */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700 tracking-wide">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowResetModal(true);
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-50/90 border border-neutral-300 rounded-xl pl-10 pr-11 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition-all"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-700 transition-colors p-0.5 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Recordar */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-0 focus:ring-offset-0 accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-600">Mantener sesión iniciada</span>
                </label>
              </div>

              {/* Botones de Navegación del Paso 2 */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                    setPassword('');
                  }}
                  className="w-1/3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-2/3 bg-neutral-900 hover:bg-black text-white font-medium py-3 px-4 rounded-xl text-sm shadow-md shadow-neutral-900/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                      <span>Ingresando...</span>
                    </>
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

          {/* Enlace de Solicitud de Registro */}
          <div className="pt-6 mt-6 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-500">
              ¿No tienes una cuenta de acceso?{' '}
              <Link to="/registro" className="text-neutral-900 hover:underline font-semibold transition-colors">
                Solicitar registro
              </Link>
            </p>
          </div>
        </div>

        {/* Card Informativa Pequeña Minimalista */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 px-4 shadow-xl flex items-center gap-3 text-xs text-white/80">
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="leading-snug">
            <span className="font-semibold text-white">Acceso Seguro:</span> Las funciones y datos del sistema se habilitan automáticamente según los roles asignados a tu usuario.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL RECUPERACIÓN DE CONTRASEÑA                                         */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-neutral-900">Restablecer Contraseña</h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Ingresa tu correo para recibir un enlace seguro de restablecimiento de contraseña.
              </p>
            </div>

            {resetSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs text-neutral-700 font-medium">
                  Si la cuenta existe, recibirás un correo con las instrucciones en breve.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowResetModal(false); setResetSent(false); }}
                  className="w-full mt-2 bg-neutral-900 hover:bg-black text-white text-xs font-medium py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="w-1/2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail}
                    className="w-1/2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar enlace'}
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



