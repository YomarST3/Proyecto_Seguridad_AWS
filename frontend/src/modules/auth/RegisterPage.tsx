import React, { useState } from 'react';
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
  FileQuestion
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validaciones del lado del cliente
    if (fullName.trim().length < 3) {
      setError('El nombre completo debe tener al menos 3 caracteres.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email.trim(), password, fullName.trim(), reason.trim());

      if (!result.success) {
        setError(result.error || 'Error al procesar el registro con Supabase Auth.');
        setLoading(false);
        return;
      }

      // Redirigir según requiera confirmación de correo o revisión de acceso
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
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 sm:p-6 relative selection:bg-zinc-800 selection:text-white">
      {/* Background visual accents */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '36px 36px'
        }}
      />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md z-10 space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shadow-md mb-3">
            <Building2 className="w-5 h-5 text-zinc-300" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            Solicitar Acceso <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">Enterprise</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
            Las nuevas cuentas corporativas se vinculan al catálogo seguro de Supabase Auth y validan roles de acceso.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-200 text-xs flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="flex-1 leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                placeholder="Ej. Martín Vargas Morales"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Correo Electrónico Empresarial
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                placeholder="colaborador@salesia.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                  placeholder="Mín. 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 p-0.5 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Área o Motivo de Acceso (Opcional)
            </label>
            <div className="relative">
              <FileQuestion className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                placeholder="Ej. Ingreso al equipo comercial / Ventas"
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-200 font-medium text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
              <span>Seguridad Zero-Trust:</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Las cuentas creadas ingresan con permisos de consulta y se validan con control de acceso por roles (RBAC).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin" />
                <span>Procesando solicitud...</span>
              </>
            ) : (
              <>
                <span>Registrar Solicitud</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-900 text-center">
          <p className="text-xs text-zinc-400">
            ¿Ya tienes una cuenta activa?{' '}
            <Link to="/login" className="text-zinc-200 hover:text-white font-medium underline underline-offset-4 transition-colors">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
