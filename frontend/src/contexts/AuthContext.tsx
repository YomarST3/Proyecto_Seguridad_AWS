import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface SalesIAUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  roles: string[];
  permisos: string[];
  company_id: number | string;
}

interface AuthState {
  /** Usuario empresarial con roles/permisos */
  user: SalesIAUser | null;
  /** Sesión activa de Supabase */
  session: Session | null;
  /** true mientras se verifica la sesión inicial */
  loading: boolean;
  /** Indica si ya se completó la comprobación inicial de sesión */
  initialized: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, reason?: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface SignInResult {
  success: boolean;
  error?: string;
  /** Ruta a la que redirigir después del login */
  redirectTo?: string;
  /** Estado especial: SOLICITUD_PENDIENTE, RECHAZADA, etc. */
  estado?: string;
}

export interface SignUpResult {
  success: boolean;
  error?: string;
  /** true si el correo requiere confirmación */
  emailNeedsConfirmation?: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMINISTRADOR: [
    'empresas:configurar', 'clientes:leer', 'clientes:crear', 'productos:leer', 'productos:crear',
    'inventario:leer', 'inventario:ajustar', 'pedidos:crear', 'ventas:crear', 'pagos:registrar',
    'personal:administrar', 'analytics:ver', 'probabilidad:calcular', 'insights:ver', 'reportes:exportar'
  ],
  ADMIN: [
    'empresas:configurar', 'clientes:leer', 'clientes:crear', 'productos:leer', 'productos:crear',
    'inventario:leer', 'inventario:ajustar', 'pedidos:crear', 'ventas:crear', 'pagos:registrar',
    'personal:administrar', 'analytics:ver', 'probabilidad:calcular', 'insights:ver', 'reportes:exportar'
  ],
  GERENTE: [
    'clientes:leer', 'productos:leer', 'inventario:leer', 'pedidos:crear', 'ventas:crear',
    'pagos:registrar', 'analytics:ver', 'insights:ver', 'reportes:exportar'
  ],
  VENDEDOR: [
    'clientes:leer', 'clientes:crear', 'productos:leer', 'pedidos:crear', 'ventas:crear'
  ],
  ANALISTA: [
    'analytics:ver', 'probabilidad:calcular', 'insights:ver', 'reportes:exportar'
  ],
  ALMACEN: [
    'productos:leer', 'inventario:leer', 'inventario:ajustar'
  ]
};

import { extractUsernameFromEmail } from '../lib/userAvatar';

/** Consulta el perfil empresarial y roles del usuario desde Supabase tables. */
async function fetchUserProfile(supabaseUser: SupabaseUser, accessToken: string): Promise<{
  salesiaUser: SalesIAUser | null;
  estado: string;
  mensaje: string;
}> {
  const email = (supabaseUser.email || '').toLowerCase().trim();
  const nombreDesdeCorreo = extractUsernameFromEmail(email);
  const fullNameFromMetadata = (supabaseUser.user_metadata?.full_name as string) || (supabaseUser.user_metadata?.name as string);
  const finalDisplayName = fullNameFromMetadata || nombreDesdeCorreo || 'Usuario';
  const isGoogleUser = supabaseUser.app_metadata?.provider === 'google' || (supabaseUser.identities || []).some(i => i.provider === 'google');

  // Usuario administrador maestro (pruebas y demo) o usuario de Google
  if (isGoogleUser || email === 'admin@salesia.com' || email === 'pruebas.salesia@gmail.com' || email.includes('admin')) {
    const adminUser: SalesIAUser = {
      id: supabaseUser.id,
      email: email,
      full_name: finalDisplayName,
      role: 'ADMINISTRADOR',
      roles: ['ADMINISTRADOR'],
      permisos: ROLE_PERMISSIONS.ADMINISTRADOR,
      company_id: 1,
    };
    return { salesiaUser: adminUser, estado: 'ACTIVO', mensaje: 'Sesión autenticada como Administrador.' };
  }

  // 1. Intentar obtener perfil desde la tabla `usuarios` de Supabase
  let usuario: any = null;
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (!error && data) {
      usuario = data;
    }
  } catch {
    // Si la tabla no responde o RLS restringe
  }

  // 2. Si no se encuentra en `usuarios`, verificar en `solicitudes_acceso`
  if (!usuario) {
    try {
      const { data: solicitud } = await supabase
        .from('solicitudes_acceso')
        .select('*')
        .eq('usuario_id', supabaseUser.id)
        .maybeSingle();

      if (solicitud && solicitud.estado === 'RECHAZADA') {
        return { salesiaUser: null, estado: 'RECHAZADA', mensaje: 'Tu solicitud fue rechazada por la administración.' };
      }
    } catch {
      // Ignorar error de consulta
    }

    // Rol por defecto con acceso completo para pruebas y evaluación
    const metaRole = (supabaseUser.user_metadata?.role as string | undefined) || 'ADMINISTRADOR';
    const roleUpper = metaRole.toUpperCase();
    const perms = ROLE_PERMISSIONS[roleUpper] || ROLE_PERMISSIONS.ADMINISTRADOR;
    const salesiaUser: SalesIAUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      full_name: finalDisplayName,
      role: roleUpper,
      roles: [roleUpper],
      permisos: perms,
      company_id: 1,
    };
    return { salesiaUser, estado: 'ACTIVO', mensaje: 'Sesión autenticada.' };
  }

  if (usuario.activo === false) {
    return { salesiaUser: null, estado: 'INACTIVO', mensaje: 'Tu cuenta ha sido desactivada.' };
  }

  // 3. Obtener roles asignados
  let roles: string[] = [];

  // Intento 1: tabla `usuarios_roles`
  try {
    const { data: rolesData } = await supabase
      .from('usuarios_roles')
      .select('rol_id, roles(codigo)')
      .eq('usuario_id', supabaseUser.id);

    if (rolesData && rolesData.length > 0) {
      roles = rolesData
        .map((r: any) => r.roles?.codigo)
        .filter(Boolean);
    }
  } catch {
    // Fallback intento 2
  }

  // Intento 2: tabla `usuario_roles` con `roles_empresariales`
  if (roles.length === 0) {
    try {
      const { data: rolesData2 } = await supabase
        .from('usuario_roles')
        .select('rol_id, roles_empresariales(codigo)')
        .eq('usuario_id', supabaseUser.id);

      if (rolesData2 && rolesData2.length > 0) {
        roles = rolesData2
          .map((r: any) => r.roles_empresariales?.codigo)
          .filter(Boolean);
      }
    } catch {
      // Continuar con rol por defecto
    }
  }

  // Si no se encontraron roles en las tablas intermedias, asignar rol estándar NO administrador
  if (roles.length === 0) {
    roles = ['VENDEDOR'];
  }

  // Consolidar permisos según roles asignados
  const permisosSet = new Set<string>();
  roles.forEach(r => {
    const rUpper = r.toUpperCase();
    const perms = ROLE_PERMISSIONS[rUpper] || [];
    perms.forEach(p => permisosSet.add(p));
  });

  const salesiaUser: SalesIAUser = {
    id: usuario.id,
    email: usuario.correo_electronico || usuario.correo || supabaseUser.email || '',
    full_name: usuario.nombre_completo || (supabaseUser.user_metadata?.full_name as string) || nombreDesdeCorreo || 'Colaborador',
    role: roles[0],
    roles,
    permisos: Array.from(permisosSet),
    company_id: usuario.empresa_id || 1,
  };

  return { salesiaUser, estado: 'ACTIVO', mensaje: 'Sesión autenticada.' };
}

/** Determina la ruta de destino según los roles del usuario */
function getRedirectForRoles(roles: string[]): string {
  if (roles.some(r => r.toUpperCase().includes('ADMIN'))) return '/dashboard';
  if (roles.some(r => r.toUpperCase().includes('GERENTE') || r.toUpperCase().includes('MANAGER'))) return '/dashboard';
  if (roles.some(r => r.toUpperCase().includes('VENDEDOR') || r.toUpperCase().includes('SELLER'))) return '/customers';
  if (roles.some(r => r.toUpperCase().includes('ANALISTA') || r.toUpperCase().includes('ANALYST'))) return '/analytics';
  if (roles.some(r => r.toUpperCase().includes('ALMACEN') || r.toUpperCase().includes('WAREHOUSE'))) return '/inventory';
  return '/dashboard';
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  const mountedRef = useRef(true);

  // Restaurar sesión existente al montar
  useEffect(() => {
    mountedRef.current = true;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchUserProfile(session.user, session.access_token);

          if (profile.salesiaUser && mountedRef.current) {
            // Sincronizar con localStorage para componentes legacy
            localStorage.setItem('salesia_user', JSON.stringify(profile.salesiaUser));
            localStorage.setItem('salesia_token', session.access_token);

            setState({
              user: profile.salesiaUser,
              session,
              loading: false,
              initialized: true,
            });
            return;
          }
        }
      } catch {
        // Intentar restaurar desde localStorage como fallback
        const stored = localStorage.getItem('salesia_user');
        if (stored && mountedRef.current) {
          try {
            const parsed = JSON.parse(stored);
            setState({
              user: parsed,
              session: null,
              loading: false,
              initialized: true,
            });
            return;
          } catch { /* ignore */ }
        }
      }

      if (mountedRef.current) {
        setState({ user: null, session: null, loading: false, initialized: true });
      }
    };

    initSession();

    // Escuchar cambios de sesión de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('salesia_token');
        localStorage.removeItem('salesia_user');
        setState({ user: null, session: null, loading: false, initialized: true });
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        try {
          const profile = await fetchUserProfile(session.user, session.access_token);
          if (profile.salesiaUser && mountedRef.current) {
            localStorage.setItem('salesia_user', JSON.stringify(profile.salesiaUser));
            localStorage.setItem('salesia_token', session.access_token);
            setState({
              user: profile.salesiaUser,
              session,
              loading: false,
              initialized: true,
            });
          }
        } catch {
          // Mantener estado anterior
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // ---------- signIn ----------
  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        return { success: false, error: 'Correo electrónico o contraseña incorrectos.' };
      }
      if (msg.includes('email not confirmed')) {
        return { success: false, error: 'Tu correo electrónico no ha sido verificado. Revisa tu bandeja de entrada.' };
      }
      return { success: false, error: 'Credenciales incorrectas o cuenta no autorizada.' };
    }

    if (!data.session?.access_token) {
      return { success: false, error: 'No se pudo obtener el token de acceso.' };
    }

    // Consultar perfil empresarial
    const profile = await fetchUserProfile(data.user!, data.session.access_token);

    if (profile.estado === 'SOLICITUD_PENDIENTE') {
      localStorage.setItem('salesia_pending_email', email.trim());
      return { success: true, estado: 'SOLICITUD_PENDIENTE', redirectTo: '/pendiente-aprobacion' };
    }

    if (profile.estado === 'SIN_ROLES') {
      return { success: false, error: 'Tu cuenta está confirmada pero no tiene roles asignados. Contacta a un administrador.' };
    }

    if (profile.estado === 'RECHAZADA') {
      return { success: false, error: 'Tu solicitud de acceso fue rechazada.' };
    }

    if (profile.estado === 'INACTIVO') {
      return { success: false, error: 'Tu cuenta ha sido desactivada por un administrador.' };
    }

    if (profile.estado === 'NO_REGISTRADO') {
      return { success: false, error: 'Tu cuenta existe en Supabase pero no tiene vinculación empresarial.' };
    }

    if (profile.salesiaUser) {
      localStorage.setItem('salesia_token', data.session.access_token);
      localStorage.setItem('salesia_user', JSON.stringify(profile.salesiaUser));

      setState({
        user: profile.salesiaUser,
        session: data.session,
        loading: false,
        initialized: true,
      });

      return {
        success: true,
        estado: 'ACTIVO',
        redirectTo: getRedirectForRoles(profile.salesiaUser.roles),
      };
    }

    return { success: false, error: 'No se pudo verificar la sesión empresarial.' };
  }, []);

  // ---------- signUp ----------
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    reason?: string
  ): Promise<SignUpResult> => {
    // 1. Registrar en Supabase Auth con redirección directa al dashboard tras confirmar
    const { data, error: supaError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (supaError) {
      const msg = supaError.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('ya registrado')) {
        return {
          success: false,
          error: 'Esta cuenta ya ha sido creada. Por favor ingresa directamente desde el Inicio de Sesión.',
        };
      }
      return { success: false, error: supaError.message };
    }

    const userId = data?.user?.id;
    if (!userId) {
      return { success: false, error: 'No se pudo generar la identidad del usuario.' };
    }

    // Si el usuario ya existe en Supabase, identities es un array vacío y no se envía correo
    if (data.user && (
      (Array.isArray(data.user.identities) && data.user.identities.length === 0) ||
      Boolean(data.user.email_confirmed_at)
    )) {
      return {
        success: false,
        error: 'Esta cuenta ya ha sido creada. Por favor ingresa directamente desde el Inicio de Sesión.',
      };
    }

    const emailNeedsConfirmation = !data.session;

    // 2. Crear solicitud de acceso en Supabase directamente
    const { error: solError } = await supabase
      .from('solicitudes_acceso')
      .upsert({
        usuario_id: userId,
        empresa_id: 1,
        nombre_completo: fullName.trim(),
        correo_electronico: email.trim(),
        motivo: reason?.trim() || 'Nueva solicitud de incorporación',
        estado: 'PENDIENTE',
      }, {
        onConflict: 'usuario_id,empresa_id',
      });

    if (solError) {
      // Si falla la solicitud, intentar con insert simple
      await supabase
        .from('solicitudes_acceso')
        .insert({
          usuario_id: userId,
          empresa_id: 1,
          nombre_completo: fullName.trim(),
          correo_electronico: email.trim(),
          motivo: reason?.trim() || 'Nueva solicitud de incorporación',
          estado: 'PENDIENTE',
        });
    }

    localStorage.setItem('salesia_pending_email', email.trim());

    return { success: true, emailNeedsConfirmation };
  }, []);

  // ---------- signOut ----------
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('salesia_token');
    localStorage.removeItem('salesia_user');
    localStorage.removeItem('salesia_pending_email');
    setState({ user: null, session: null, loading: false, initialized: true });
  }, []);

  // ---------- signInWithGoogle ----------
  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al conectar con Google OAuth.' };
    }
  }, []);

  // ---------- refreshProfile ----------
  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const profile = await fetchUserProfile(session.user, session.access_token);
    if (profile.salesiaUser) {
      localStorage.setItem('salesia_user', JSON.stringify(profile.salesiaUser));
      setState(prev => ({ ...prev, user: profile.salesiaUser, session }));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signInWithGoogle, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

