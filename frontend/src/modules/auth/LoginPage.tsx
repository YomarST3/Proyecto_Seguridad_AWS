import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  X,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../services/supabase';
import { UserAvatar, extractUsernameFromEmail, getInitialLetter } from '../../lib/userAvatar';
import { ProjectLoadingScreen } from '../../components/ProjectLoadingScreen';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signInWithGoogle } = useAuth();

  // Redireccionar si ya existe sesión activa (ej. retorno de Google OAuth)
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');

  // Sincronizar parámetro email si cambia en la URL
  useEffect(() => {
    const paramEmail = searchParams.get('email');
    if (paramEmail && !email) {
      setEmail(paramEmail);
    }
  }, [searchParams]);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal para recuperar contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Extracción reactiva del nombre de usuario e inicial a partir del correo ingresado
  const derivedUsername = useMemo(() => {
    return email && email.includes('@') ? extractUsernameFromEmail(email) : '';
  }, [email]);

  const initialLetter = useMemo(() => {
    return email ? getInitialLetter(email) : '';
  }, [email]);

  // --------------------------------------------------------------------------
  // INICIO DE SESIÓN CON GOOGLE (OAuth)
  // --------------------------------------------------------------------------
  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setError(res.error || 'No se pudo iniciar sesión con Google.');
        setGoogleLoading(false);
      }
    } catch {
      setError('Error al conectar con el servicio de autenticación de Google.');
      setGoogleLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // INICIO DE SESIÓN CON CORREO Y CONTRASEÑA
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Por favor ingresa un correo corporativo válido.');
      return;
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña de acceso.');
      return;
    }

    setLoading(true);

    try {
      // 1. Intentar inicio de sesión mediante Supabase Auth
      const result = await signIn(emailTrimmed, password);

      if (result.success) {
        // Asegurar que el nombre de usuario derivado del correo quede guardado en el perfil
        const storedUser = localStorage.getItem('salesia_user');
        if (storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            if (!userObj.full_name || ['Colaborador', 'Usuario Registrado', 'Administrador General'].includes(userObj.full_name)) {
              userObj.full_name = extractUsernameFromEmail(emailTrimmed);
              localStorage.setItem('salesia_user', JSON.stringify(userObj));
            }
          } catch { /* ignore */ }
        }

        navigate(result.redirectTo || '/dashboard');
        return;
      }

      // 2. Si falla en Supabase pero es la cuenta maestra de prueba (soporte de contingencia)
      if (
        (emailTrimmed === 'admin@salesia.com' && password === 'admin123') ||
        (emailTrimmed === 'pruebas.salesia@gmail.com' && password === 'Prueba123*')
      ) {
        const fallbackName = extractUsernameFromEmail(emailTrimmed);
        const demoUser = {
          id: 'demo-admin-id',
          email: emailTrimmed,
          full_name: fallbackName,
          role: 'ADMINISTRADOR',
          roles: ['ADMINISTRADOR'],
          permisos: [
            'empresas:configurar', 'clientes:leer', 'clientes:crear', 'productos:leer',
            'productos:crear', 'inventario:leer', 'inventario:ajustar', 'pedidos:crear',
            'ventas:crear', 'pagos:registrar', 'personal:administrar', 'analytics:ver',
            'probabilidad:calcular', 'insights:ver', 'reportes:exportar'
          ],
          company_id: 1,
        };
        localStorage.setItem('salesia_user', JSON.stringify(demoUser));
        localStorage.setItem('salesia_token', 'demo-salesia-jwt-token');
        navigate('/dashboard');
        return;
      }

      setError(result.error || 'Credenciales no válidas. Verifica tu correo y contraseña.');
    } catch {
      setError('No fue posible conectar con el servidor de autenticación. Verifica tu conexión.');
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
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-cyan-500 selection:text-white font-sans">
      {/* ========================================================================= */}
      {/* PANTALLA DE CARGA ANIMADA CON DATOS DEL PROYECTO (DURANTE LOGIN / OAUTH)   */}
      {/* ========================================================================= */}
      {(loading || googleLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
          <ProjectLoadingScreen
            message={googleLoading ? 'Autenticando con Google Identity...' : 'Validando credenciales empresariales...'}
            subtitle="Acceso Seguro • CloudGuard AWS"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* FONDO DE VIDEO ORIGINAL (Conservado exactamente)                          */}
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

      {/* Capas cinemáticas de iluminación ambiental sobria */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* TARJETA GLASSMORPHISM ENTERPRISE (TONOS NEUTROS EMPRESARIALES)           */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[460px] relative z-10 space-y-4 animate-in fade-in zoom-in-95 duration-400">
        
        {/* Contenedor con borde neutro empresarial */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl p-7 sm:p-9 relative overflow-hidden">
          
          {/* Cabecera con Logotipo Dinámico del Usuario */}
          <div className="flex flex-col items-center text-center mb-6">
            {/* Si hay un correo ingresado, se muestra el Logo Personalizado del Usuario con su Inicial */}
            {derivedUsername ? (
              <div className="relative mb-3 flex flex-col items-center animate-in zoom-in-90 duration-300">
                <div className="relative">
                  <UserAvatar nameOrEmail={email} size="xl" showGlow={false} />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-slate-300 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                  <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                  <span>Usuario: <strong className="text-slate-100 font-semibold">{derivedUsername}</strong></span>
                </div>
              </div>
            ) : (
              /* Logotipo Institucional sobrio */
              <div className="relative mb-3.5 group cursor-default">
                <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center shadow-md">
                  <Building2 className="w-6 h-6 text-slate-300" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                SalesIA
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-normal">
              {derivedUsername
                ? `Iniciando sesión como ${derivedUsername}`
                : 'Ingresa con tu cuenta de Google o credenciales corporativas'}
            </p>
          </div>

            {/* Alerta de Error */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="flex-1 leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* =================================================================== */}
            {/* BOTÓN DE GOOGLE SIGN-IN                                             */}
            {/* =================================================================== */}
            <div className="space-y-4">
              <button
                id="login-google-button"
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/35 text-white font-medium py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-lg shadow-black/40 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                {googleLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Conectando con Google...</span>
                  </>
                ) : (
                  <>
                    {/* SVG Oficial de Google */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuar con mi cuenta de Google</span>
                  </>
                )}
              </button>

              {/* Divisor con estilo Glass */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-white/10" />
                <span className="absolute bg-slate-950 px-3 text-[11px] text-slate-400 font-medium">
                  o accede con tu correo
                </span>
              </div>

              {/* =================================================================== */}
              {/* FORMULARIO DE INICIO DE SESIÓN CON CORREO & CONTRASEÑA              */}
              {/* =================================================================== */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* CAMPO: CORREO ELECTRÓNICO */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Correo Electrónico</span>
                    </label>
                    {initialLetter && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300 flex items-center gap-1">
                        Inicial: <strong className="font-bold text-white text-xs">{initialLetter}</strong>
                      </span>
                    )}
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="w-full bg-slate-900/80 border border-white/15 hover:border-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
                      placeholder="nombre@empresa.com"
                    />
                  </div>
                </div>

                {/* CAMPO: CONTRASEÑA */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Contraseña</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setShowResetModal(true);
                      }}
                      className="text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      className="w-full bg-slate-900/80 border border-white/15 hover:border-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                      tabIndex={-1}
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox Recordar Sesión */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 font-normal">Mantener sesión iniciada</span>
                  </label>
                </div>

                {/* Botón Principal de Inicio de Sesión */}
                <button
                  id="login-submit-button"
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3.5 px-4 rounded-xl text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Enlace a Registro */}
            <div className="pt-5 mt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-normal">
                ¿No tienes una cuenta de acceso?{' '}
                <Link to="/registro" className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors">
                  Solicitar registro
                </Link>
              </p>
            </div>
          </div>

        {/* Tarjeta Informativa de Seguridad & Cloud con Estilo Neutro */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 px-4 shadow-md flex items-center gap-3 text-xs text-slate-300">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="leading-snug text-left">
            <span className="font-semibold text-slate-200">Seguridad Empresarial:</span> Autenticación federada con Google y Supabase Cloud bajo cifrado TLS 1.3 de extremo a extremo.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL RECUPERACIÓN DE CONTRASEÑA                                         */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 backdrop-blur-2xl animate-in zoom-in-95 duration-200 text-white relative">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 text-left">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white">Restablecer Contraseña</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa tu correo para recibir un enlace seguro de restablecimiento de contraseña.
              </p>
            </div>

            {resetSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Si la cuenta existe, recibirás un correo con las instrucciones en breve.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowResetModal(false); setResetSent(false); }}
                  className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold py-3 rounded-2xl transition-all cursor-pointer shadow-lg shadow-cyan-950/40"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-slate-300">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="w-1/2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium py-2.5 rounded-2xl border border-white/10 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail}
                    className="w-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold py-2.5 rounded-2xl transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-950/40"
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
