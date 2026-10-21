import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  FileQuestion,
  Sparkles,
  Dices,
  Check,
  CheckCircle2,
  Copy,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../services/supabase';
import api from '../../services/api';
import { UserAvatar, extractUsernameFromEmail, getInitialLetter } from '../../lib/userAvatar';
import { evaluatePassword, generateSecurePassword } from '../../lib/passwordStrength';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false);

  // Función para comprobar si una cuenta ya existe en la base de datos
  // Lista conocida de correos previamente registrados en Supabase o PostgreSQL
  const KNOWN_EXISTING_EMAILS = useMemo(() => new Set([
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
  ]), []);

  // Función para comprobar si una cuenta ya existe en la base de datos
  const checkIfAccountExists = async (emailToCheck: string): Promise<boolean> => {
    const trimmed = emailToCheck.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return false;

    // 1. Cuentas maestras y conocidas
    if (KNOWN_EXISTING_EMAILS.has(trimmed)) {
      return true;
    }

    // 2. Consulta al endpoint backend
    try {
      const res = await api.post('/auth/verificar-correo', { correo: trimmed });
      if (res.data?.existe === true) return true;
    } catch { /* ignore */ }

    // 3. Consulta a la tabla usuarios en Supabase
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('id')
        .eq('correo', trimmed)
        .maybeSingle();
      if (data) return true;
    } catch { /* ignore */ }

    // 4. Consulta a solicitudes_acceso en Supabase
    try {
      const { data: sol } = await supabase
        .from('solicitudes_acceso')
        .select('id')
        .eq('correo_electronico', trimmed)
        .maybeSingle();
      if (sol) return true;
    } catch { /* ignore */ }

    return false;
  };

  // Autocompletar sugerencia de nombre y verificar existencia al escribir
  const emailDebounceRef = useRef<any>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    setError(null);
    setAccountAlreadyExists(false);

    if (!fullName && val.includes('@')) {
      const suggested = extractUsernameFromEmail(val);
      if (suggested && suggested !== 'Usuario') {
        setFullName(suggested);
      }
    }

    // Comprobación en segundo plano mientras el usuario escribe
    if (emailDebounceRef.current) {
      clearTimeout(emailDebounceRef.current);
    }
    if (val.includes('@') && val.includes('.')) {
      emailDebounceRef.current = setTimeout(async () => {
        const exists = await checkIfAccountExists(val);
        if (exists) {
          setAccountAlreadyExists(true);
        }
      }, 350);
    }
  };

  // Verificación al desenfocar el campo de correo
  const handleEmailBlur = async () => {
    if (email && email.includes('@')) {
      const exists = await checkIfAccountExists(email);
      if (exists) {
        setAccountAlreadyExists(true);
      }
    }
  };


  // Evaluación reactiva de la fortaleza de la contraseña
  const passwordStrength = useMemo(() => {
    return evaluatePassword(password);
  }, [password]);

  // Letra inicial reactiva
  const initialLetter = useMemo(() => {
    return getInitialLetter(fullName || email);
  }, [fullName, email]);

  // Generador de contraseña segura aleatoria
  const handleGenerateRandomPassword = () => {
    const newPass = generateSecurePassword(14);
    setPassword(newPass);
    setConfirmPassword(newPass);
    setShowPassword(true);
    setError(null);

    // Copiar al portapapeles
    if (navigator.clipboard) {
      navigator.clipboard.writeText(newPass).then(() => {
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 3000);
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validaciones del lado del cliente
    if (fullName.trim().length < 3) {
      setError('El nombre completo debe tener al menos 3 caracteres.');
      return;
    }

    if (!passwordStrength.checks.hasMinLength) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!passwordStrength.checks.hasUppercase || !passwordStrength.checks.hasLowercase) {
      setError('La contraseña debe incluir letras mayúsculas y minúsculas.');
      return;
    }

    if (!passwordStrength.checks.hasNumber) {
      setError('La contraseña debe incluir al menos un número (0-9).');
      return;
    }

    if (!passwordStrength.checks.hasSymbol) {
      setError('La contraseña debe incluir al menos un símbolo especial (!@#$%...).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      // Verificar si la cuenta ya existe antes de intentar registrar
      const alreadyExists = await checkIfAccountExists(email.trim());
      if (alreadyExists) {
        setAccountAlreadyExists(true);
        setLoading(false);
        return;
      }

      const result = await signUp(email.trim(), password, fullName.trim(), reason.trim());

      if (!result.success) {
        if (result.error && (result.error.includes('registrado') || result.error.includes('creada') || result.error.includes('confirmado'))) {
          setAccountAlreadyExists(true);
        } else {
          setError(result.error || 'Error al procesar el registro con Supabase Auth.');
        }
        setLoading(false);
        return;
      }

      if (result.emailNeedsConfirmation) {
        navigate('/verificar-correo-pendiente');
      } else {
        navigate('/pendiente-aprobacion');
      }
    } catch {
      setError('Ocurrió un error inesperado al procesar la solicitud de registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-cyan-500 selection:text-white font-sans">
      {/* ========================================================================= */}
      {/* FONDO DE VIDEO (Mismo fondo cinematográfico para coherencia estética)    */}
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
      <div className="w-full max-w-[500px] relative z-10 space-y-4 animate-in fade-in zoom-in-95 duration-400 my-4">
        
        {/* Contenedor principal con borde neutro empresarial */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl p-7 sm:p-9 relative overflow-hidden">
          
          {/* Cabecera con Logotipo Dinámico del Usuario */}
          <div className="flex flex-col items-center text-center mb-6">
            {fullName || email ? (
              <div className="relative mb-3 flex flex-col items-center animate-in zoom-in-90 duration-300">
                <UserAvatar nameOrEmail={fullName || email} size="xl" showGlow={false} />
                <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registro: <strong className="text-slate-100 font-semibold">{fullName || extractUsernameFromEmail(email)}</strong></span>
                </div>
              </div>
            ) : (
              <div className="relative mb-3.5 group cursor-default">
                <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center shadow-md">
                  <Building2 className="w-6 h-6 text-slate-300" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Crear Cuenta
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-normal">
              Registra tus credenciales seguras para acceder al sistema
            </p>
          </div>

            {/* =================================================================== */}
            {/* ALERTA DESTACADA: ESTA CUENTA YA HA SIDO CREADA                     */}
            {/* =================================================================== */}
            {accountAlreadyExists && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-100 text-xs flex flex-col gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Esta cuenta ya ha sido creada</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  El correo <strong className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">{email}</strong> ya se encuentra registrado y activo en el sistema. No necesitas volver a registrarte.
                </p>
                <Link
                  to="/login"
                  className="mt-1 w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Ir al Inicio de Sesión con este Correo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Alerta de Error General */}
            {error && !accountAlreadyExists && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="flex-1 leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Notificación de contraseña copiada */}
            {copiedNotification && (
              <div className="mb-4 p-2.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 backdrop-blur-md animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Contraseña segura generada y copiada al portapapeles.</span>
              </div>
            )}

            {/* Formulario de Registro */}
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* CAMPO: CORREO ELECTRÓNICO */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Correo Electrónico Corporativo</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`w-full bg-slate-900/80 border rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200 ${
                      accountAlreadyExists
                        ? 'border-amber-500/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30'
                        : 'border-white/15 hover:border-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30'
                    }`}
                    placeholder="usuario@empresa.com"
                  />
                </div>
              </div>

              {/* CAMPO: NOMBRE COMPLETO */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Nombre de Usuario / Nombre Completo</span>
                  </label>
                  {initialLetter && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300 flex items-center gap-1">
                      Inicial: <strong className="font-bold text-white text-xs">{initialLetter}</strong>
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/15 hover:border-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
                    placeholder="Ej. Franco Alexander Juárez"
                  />
                </div>
              </div>

              {/* SECCIÓN DE CONTRASEÑA CON EVALUACIÓN DINÁMICA & GENERADOR */}
              <div className="space-y-2 pt-1 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Contraseña Segura</span>
                  </label>

                  {/* BOTÓN PARA GENERAR CONTRASEÑA ALEATORIA */}
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)] active:scale-95"
                    title="Generar una contraseña aleatoria con mayúsculas, números y símbolos"
                  >
                    <Dices className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Generar Aleatoria</span>
                  </button>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    id="register-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/15 hover:border-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 rounded-2xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
                    placeholder="Mínimo 8 caracteres, números y símbolos"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* =================================================================== */}
                {/* BARRA DINÁMICA DE SEGURIDAD DE CONTRASEÑA                           */}
                {/* =================================================================== */}
                {password && (
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Nivel de seguridad:</span>
                      <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${passwordStrength.color} ${passwordStrength.badgeBg}`}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Barra de progreso de fortaleza */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.barColor}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>

                    {/* Lista de Criterios Dinámicos */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div className={`flex items-center gap-1.5 ${passwordStrength.checks.hasMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                        {passwordStrength.checks.hasMinLength ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600 ml-1 mr-0.5" />}
                        <span>8+ caracteres</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordStrength.checks.hasUppercase ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                        {passwordStrength.checks.hasUppercase ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600 ml-1 mr-0.5" />}
                        <span>1 Mayúscula</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordStrength.checks.hasNumber ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                        {passwordStrength.checks.hasNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600 ml-1 mr-0.5" />}
                        <span>1 Número (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordStrength.checks.hasSymbol ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                        {passwordStrength.checks.hasSymbol ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600 ml-1 mr-0.5" />}
                        <span>1 Símbolo (!@#...)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CAMPO: CONFIRMAR CONTRASEÑA */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Confirmar Contraseña</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    id="register-confirm-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/15 hover:border-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
                    placeholder="Repite la misma contraseña"
                  />
                  {confirmPassword && password === confirmPassword && (
                    <span className="absolute right-3.5 top-3 text-emerald-400" title="Las contraseñas coinciden">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>

              {/* Botón de Enviar Registro o Redirección si la cuenta ya existe */}
              {accountAlreadyExists ? (
                <Link
                  id="register-already-exists-button"
                  to={`/login?email=${encodeURIComponent(email)}`}
                  className="w-full mt-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-3.5 px-4 rounded-2xl text-sm shadow-[0_4px_25px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_35px_rgba(245,158,11,0.6)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] text-center"
                >
                  <AlertCircle className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Esta cuenta ya ha sido creada — Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 shrink-0" />
                </Link>
              ) : (
                <button
                  id="register-submit-button"
                  type="submit"
                  disabled={loading || !fullName.trim() || !email.trim() || !password || !confirmPassword}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3.5 px-4 rounded-xl text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registrando cuenta segura...</span>
                    </>
                  ) : (
                    <>
                      <span>Completar Registro de Usuario</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>

            {/* Enlace para volver a Inicio de Sesión */}
            <div className="pt-5 mt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-normal">
                ¿Ya tienes una cuenta registrada?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors">
                  Ir al Inicio de Sesión
                </Link>
              </p>
            </div>
          </div>

        {/* Tarjeta Informativa de Seguridad con Estilo Neutro */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 px-4 shadow-md flex items-center gap-3 text-xs text-slate-300">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="leading-snug text-left">
            <span className="font-semibold text-slate-200">Cifrado Empresarial:</span> Las contraseñas se almacenan con hash criptográfico unidireccional y se vinculan a la base de datos de usuarios de Supabase.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
