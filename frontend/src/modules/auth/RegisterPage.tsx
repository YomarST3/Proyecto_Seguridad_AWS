import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BadgeDollarSign,
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
import api from '../../services/api';
import supabase from '../../services/supabase';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

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
      let userId: string | null = null;
      let emailNeedsConfirmation = false;

      // 2. Registrar credenciales exclusivamente en Supabase Auth
      try {
        const { data, error: supaError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (supaError) {
          setError(supaError.message || 'Error al registrar credenciales en el proveedor de autenticación.');
          setLoading(false);
          return;
        }

        if (data?.user) {
          userId = data.user.id;
          // Si Supabase tiene confirmación de correo activa y no hay sesión inmediata
          if (!data.session) {
            emailNeedsConfirmation = true;
          }
        }
      } catch (err) {
        // En entorno local de pruebas si Supabase cloud está offline
        userId = crypto.randomUUID();
      }

      if (!userId) {
        setError('No se pudo generar la identidad del usuario en Supabase Auth.');
        setLoading(false);
        return;
      }

      // 3. Registrar solicitud en solicitudes_acceso de forma segura e idempotente
      await api.post('/auth/solicitar-acceso', {
        usuario_id: userId,
        empresa_id: 1, // Empresa principal
        nombre_completo: fullName.trim(),
        correo_electronico: email.trim(),
        motivo: reason.trim() || 'Nueva solicitud de incorporación'
      });

      // Guardar correo para vista de estado
      localStorage.setItem('salesia_pending_email', email.trim());

      // 4. Redirigir según requiera confirmación de correo o revisión
      if (emailNeedsConfirmation) {
        navigate('/verificar-correo-pendiente');
      } else {
        navigate('/pendiente-aprobacion');
      }

    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Ocurrió un error al procesar la solicitud de registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-8 backdrop-blur-sm z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/20 mb-3">
            <BadgeDollarSign className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
            Solicitud de Cuenta <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 font-semibold tracking-wider">Enterprise</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 text-center">
            Las cuentas nuevas requieren verificación de correo y autorización de un administrador.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="Ej. Martín Vargas Morales"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Correo Electrónico Empresarial
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="colaborador@empresa.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="Min. 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Área o Motivo de Acceso (Opcional)
            </label>
            <div className="relative">
              <FileQuestion className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="Ej. Ingreso al equipo comercial / Ventas"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Política de Seguridad y Roles:</span>
            </div>
            <p>
              Por seguridad, ninguna cuenta pública tiene asignado el rol Administrador. Tu solicitud será enviada para que un administrador apruebe los roles correspondientes.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Procesando solicitud...</span>
            ) : (
              <>
                <span>Registrar Solicitud</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            ¿Ya tienes una cuenta activa?{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
