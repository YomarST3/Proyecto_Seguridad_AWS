import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Building2,
  Key,
  Database,
  CheckCircle2,
  UserPlus,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Mail,
  User as UserIcon,
  Check,
  Users,
  UserCheck,
  UserX,
  Search,
  Edit,
  ShieldAlert,
  Calendar,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react';
import {
  getSettingsUsers,
  getSettingsSolicitudes,
  getSettingsRoles,
  getSettingsPermisos,
  approveSolicitud,
  rejectSolicitud,
  updateUserStatus,
  assignUserRoles,
  updateUserPassword,
  createAdminUser
} from '../../services/mockDataService';
import { SolicitudAcceso, UsuarioEmpresarial, RolEmpresarial, PermisoItem } from '../../types';

interface RolItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'solicitudes' | 'rbac' | 'general'>('usuarios');
  
  // Solicitudes
  const [solicitudes, setSolicitudes] = useState<SolicitudAcceso[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [rolesSeleccionados, setRolesSeleccionados] = useState<Record<number, number[]>>({});
  
  // Usuarios
  const [usuarios, setUsuarios] = useState<UsuarioEmpresarial[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [filtroRol, setFiltroRol] = useState<string>('TODOS');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  
  // Modal de Roles para Usuario
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioEmpresarial | null>(null);
  const [rolesUsuarioEditando, setRolesUsuarioEditando] = useState<number[]>([]);
  const [guardandoRoles, setGuardandoRoles] = useState(false);

  // Modal de Configurar Contraseña Administrativa
  const [usuarioPasswordModal, setUsuarioPasswordModal] = useState<UsuarioEmpresarial | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  // Modal de Nuevo Colaborador / Usuario
  const [abrirModalNuevoUsuario, setAbrirModalNuevoUsuario] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoRol, setNuevoRol] = useState('VENDEDOR');
  const [nuevaUserPassword, setNuevaUserPassword] = useState('');
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  // Catálogos
  const [rolesCatalogo, setRolesCatalogo] = useState<RolEmpresarial[]>([]);
  const [permisosCatalogo, setPermisosCatalogo] = useState<PermisoItem[]>([]);
  const [cargandoRbac, setCargandoRbac] = useState(false);

  // Estados generales
  const [procesandoId, setProcesandoId] = useState<number | string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const currentUser = (() => {
    try {
      const u = localStorage.getItem('salesia_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const rolesDisponibles: RolItem[] = [
    { id: 1, codigo: 'ADMINISTRADOR', nombre: 'Administrador', descripcion: 'Control total de configuración, roles y auditoría sensible' },
    { id: 2, codigo: 'GERENTE', nombre: 'Gerente', descripcion: 'Supervisión comercial integral, reportes ejecutivos y metas' },
    { id: 3, codigo: 'VENDEDOR', nombre: 'Vendedor', descripcion: 'Gestión de clientes, catálogo, pedidos y ventas asignadas' },
    { id: 4, codigo: 'ANALISTA', nombre: 'Analista BI', descripcion: 'Exploración de datos, motor de probabilidades e insights de IA' },
    { id: 5, codigo: 'ALMACEN', nombre: 'Almacén', descripcion: 'Control de existencias físicas, movimientos y alertas de inventario' }
  ];

  // --------------------------------------------------------------------------
  // CARGAS DE DATOS
  // --------------------------------------------------------------------------
  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    setMensajeError(null);
    try {
      const data = await getSettingsUsers();
      setUsuarios(data as UsuarioEmpresarial[]);
    } catch (err: any) {
      setMensajeError('Error al cargar usuarios empresariales.');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const cargarSolicitudes = async () => {
    setCargandoSolicitudes(true);
    setMensajeError(null);
    try {
      const data = await getSettingsSolicitudes();
      setSolicitudes(data as SolicitudAcceso[]);
      const initialRoles: Record<number, number[]> = {};
      data.forEach((sol: any) => {
        initialRoles[sol.id] = [3]; // Default VENDEDOR
      });
      setRolesSeleccionados(initialRoles);
    } catch (err: any) {
      setMensajeError('Error al cargar solicitudes de acceso.');
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  const cargarCatalogoRbac = async () => {
    setCargandoRbac(true);
    try {
      const [resRoles, resPermisos] = await Promise.all([
        getSettingsRoles(),
        getSettingsPermisos()
      ]);
      setRolesCatalogo(resRoles as RolEmpresarial[]);
      setPermisosCatalogo(resPermisos as PermisoItem[]);
    } catch (err: any) {
      console.error('Error cargando catalogo RBAC:', err);
    } finally {
      setCargandoRbac(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'usuarios') {
      cargarUsuarios();
    } else if (activeTab === 'solicitudes') {
      cargarSolicitudes();
    } else if (activeTab === 'rbac') {
      cargarCatalogoRbac();
    }
  }, [activeTab]);

  // --------------------------------------------------------------------------
  // GESTIÓN DE SOLICITUDES
  // --------------------------------------------------------------------------
  const toggleRolSolicitud = (solicitudId: number, rolId: number) => {
    const actuales = rolesSeleccionados[solicitudId] || [];
    const yaTiene = actuales.includes(rolId);
    let nuevos: number[];

    if (yaTiene) {
      nuevos = actuales.filter((id) => id !== rolId);
      if (nuevos.length === 0) return;
    } else {
      nuevos = [...actuales, rolId];
    }

    setRolesSeleccionados({
      ...rolesSeleccionados,
      [solicitudId]: nuevos
    });
  };

  const handleAprobarSolicitud = async (solicitudId: number) => {
    const rolesIds = rolesSeleccionados[solicitudId] || [3];
    setProcesandoId(solicitudId);
    setMensajeExito(null);
    setMensajeError(null);

    try {
      const res = await approveSolicitud(solicitudId, rolesIds);
      setMensajeExito(res.mensaje || `Solicitud #${solicitudId} aprobada correctamente.`);
      await cargarSolicitudes();
      await cargarUsuarios();
    } catch (err: any) {
      setMensajeError('Error al aprobar solicitud de acceso.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazarSolicitud = async (solicitudId: number) => {
    if (!window.confirm('¿Confirmas que deseas rechazar esta solicitud de acceso?')) {
      return;
    }

    setProcesandoId(solicitudId);
    setMensajeExito(null);
    setMensajeError(null);

    try {
      const res = await rejectSolicitud(solicitudId);
      setMensajeExito(res.mensaje || `Solicitud #${solicitudId} rechazada.`);
      await cargarSolicitudes();
    } catch (err: any) {
      setMensajeError('Error al rechazar solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  // --------------------------------------------------------------------------
  // GESTIÓN DE USUARIOS
  // --------------------------------------------------------------------------
  const handleToggleEstadoUsuario = async (u: UsuarioEmpresarial) => {
    // Si se intenta desactivar al propio usuario actual
    if (currentUser?.id === u.id && u.activo) {
      if (!window.confirm('¿Estás seguro de desactivar tu propia cuenta? Podrías perder el acceso al sistema.')) {
        return;
      }
    }

    setProcesandoId(u.id);
    setMensajeExito(null);
    setMensajeError(null);

    try {
      const res = await updateUserStatus(u.id, !u.activo);
      setMensajeExito(res.mensaje || `Usuario ${u.nombre_completo} ${!u.activo ? 'activado' : 'desactivado'} con éxito.`);
      await cargarUsuarios();
    } catch (err: any) {
      setMensajeError('No se pudo actualizar el estado del usuario.');
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirModalRoles = (u: UsuarioEmpresarial) => {
    // Buscar ids de los roles que tiene el usuario
    const ids: number[] = [];
    u.roles.forEach((nombreRol) => {
      const r = rolesDisponibles.find((item) => item.codigo === nombreRol || item.nombre.toLowerCase() === nombreRol.toLowerCase());
      if (r) ids.push(r.id);
    });
    setRolesUsuarioEditando(ids);
    setUsuarioEditando(u);
    setMensajeError(null);
    setMensajeExito(null);
  };

  const toggleRolUsuarioEditando = (rolId: number) => {
    const yaTiene = rolesUsuarioEditando.includes(rolId);
    if (yaTiene) {
      if (rolesUsuarioEditando.length === 1) {
        alert('El usuario debe tener al menos un rol asignado.');
        return;
      }
      setRolesUsuarioEditando(rolesUsuarioEditando.filter((id) => id !== rolId));
    } else {
      setRolesUsuarioEditando([...rolesUsuarioEditando, rolId]);
    }
  };

  const handleGuardarRolesUsuario = async () => {
    if (!usuarioEditando) return;
    setGuardandoRoles(true);
    setMensajeError(null);
    setMensajeExito(null);

    try {
      const res = await assignUserRoles(usuarioEditando.id, rolesUsuarioEditando);
      setMensajeExito(res.mensaje || `Roles actualizados correctamente para ${usuarioEditando.nombre_completo}.`);
      setUsuarioEditando(null);
      await cargarUsuarios();
    } catch (err: any) {
      setMensajeError('Error al actualizar roles.');
    } finally {
      setGuardandoRoles(false);
    }
  };

  // --------------------------------------------------------------------------
  // GESTIÓN DE CONTRASEÑAS & GOBERNANZA DE CUENTAS
  // --------------------------------------------------------------------------
  const generarPasswordSegura = () => {
    const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsLower = 'abcdefghijkmnpqrstuvwxyz';
    const charsNum = '23456789';
    const charsSym = '@$!%*?&#';
    let res = '';
    res += charsUpper[Math.floor(Math.random() * charsUpper.length)];
    res += charsLower[Math.floor(Math.random() * charsLower.length)];
    res += charsNum[Math.floor(Math.random() * charsNum.length)];
    res += charsSym[Math.floor(Math.random() * charsSym.length)];
    const all = charsUpper + charsLower + charsNum + charsSym;
    for (let i = 0; i < 8; i++) {
      res += all[Math.floor(Math.random() * all.length)];
    }
    return res.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const evaluarFuerzaPassword = (p: string) => {
    if (!p) return { nivel: 'Sin definir', porcentaje: 0, color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (p.length >= 12) score++;

    if (score <= 2) return { nivel: 'Débil', porcentaje: 35, color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 4) return { nivel: 'Segura', porcentaje: 75, color: 'bg-amber-500', text: 'text-amber-600' };
    return { nivel: 'Muy Robusta', porcentaje: 100, color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const abrirModalPassword = (u: UsuarioEmpresarial) => {
    setUsuarioPasswordModal(u);
    setNuevaPassword('');
    setConfirmarPassword('');
    setMostrarPassword(false);
    setMensajeError(null);
    setMensajeExito(null);
  };

  const handleGuardarPassword = async () => {
    if (!usuarioPasswordModal) return;
    if (!nuevaPassword || nuevaPassword.length < 8) {
      alert('La contraseña debe tener un mínimo de 8 caracteres seguros.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      alert('Las contraseñas no coinciden. Por favor verifique.');
      return;
    }

    setGuardandoPassword(true);
    setMensajeError(null);
    setMensajeExito(null);

    try {
      const res = await updateUserPassword(usuarioPasswordModal.id, nuevaPassword);
      setMensajeExito(res.mensaje || `Contraseña actualizada para ${usuarioPasswordModal.correo_electronico}.`);
      setUsuarioPasswordModal(null);
    } catch (err: any) {
      setMensajeError('No se pudo actualizar la contraseña del usuario.');
    } finally {
      setGuardandoPassword(false);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) {
      alert('Por favor complete el nombre y correo corporativo.');
      return;
    }
    setCreandoUsuario(true);
    setMensajeError(null);
    setMensajeExito(null);

    try {
      const pass = nuevaUserPassword.trim() || generarPasswordSegura();
      await createAdminUser({
        nombre_completo: nuevoNombre.trim(),
        correo_electronico: nuevoCorreo.trim().toLowerCase(),
        telefono: nuevoTelefono.trim() || '+51 987 000 000',
        roles: [nuevoRol],
        password: pass
      });
      setMensajeExito(`Usuario ${nuevoNombre} creado con éxito con rol ${nuevoRol}.`);
      setAbrirModalNuevoUsuario(false);
      setNuevoNombre('');
      setNuevoCorreo('');
      setNuevoTelefono('');
      setNuevaUserPassword('');
      await cargarUsuarios();
    } catch (err: any) {
      setMensajeError('Error al crear colaborador.');
    } finally {
      setCreandoUsuario(false);
    }
  };

  // Filtrado de usuarios (Estado + Rol + Búsqueda)
  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroEstado === 'ACTIVOS' && !u.activo) return false;
    if (filtroEstado === 'INACTIVOS' && u.activo) return false;
    if (filtroRol !== 'TODOS') {
      const match = u.roles.some((r) => r.toUpperCase().includes(filtroRol));
      if (!match) return false;
    }
    if (busquedaUsuario.trim()) {
      const q = busquedaUsuario.toLowerCase();
      return (
        u.nombre_completo.toLowerCase().includes(q) ||
        u.correo_electronico.toLowerCase().includes(q) ||
        u.roles.some((r) => r.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalActivos = usuarios.filter((u) => u.activo).length;
  const totalInactivos = usuarios.filter((u) => !u.activo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            Administración & Seguridad Empresarial
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gobernanza de identidades Supabase Auth, roles corporativos y auditoría de accesos.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'usuarios'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-600" />
            Usuarios & Roles
            <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {usuarios.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'solicitudes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-sky-600" />
            Solicitudes
            {solicitudes.length > 0 && (
              <span className="bg-sky-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {solicitudes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rbac'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Matriz RBAC
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            General
          </button>
        </div>
      </div>

      {/* Notifications */}
      {mensajeExito && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB: USUARIOS & ROLES (Sección 10 del Prompt)                          */}
      {/* ==================================================================== */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Usuarios Activos</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{totalActivos}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Usuarios Inactivos</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{totalInactivos}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Solicitudes en Espera</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{solicitudes.length}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, correo o rol..."
                    value={busquedaUsuario}
                    onChange={(e) => setBusquedaUsuario(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Filter controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setFiltroEstado('TODOS')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        filtroEstado === 'TODOS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Todos ({usuarios.length})
                    </button>
                    <button
                      onClick={() => setFiltroEstado('ACTIVOS')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        filtroEstado === 'ACTIVOS' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Activos ({totalActivos})
                    </button>
                    <button
                      onClick={() => setFiltroEstado('INACTIVOS')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        filtroEstado === 'INACTIVOS' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Inactivos ({totalInactivos})
                    </button>
                  </div>

                  <button
                    onClick={() => setAbrirModalNuevoUsuario(true)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Nuevo Colaborador
                  </button>

                  <button
                    onClick={cargarUsuarios}
                    disabled={cargandoUsuarios}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                    title="Recargar usuarios de la base de datos"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cargandoUsuarios ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Filtros por Rol Corporativo para mantener el orden */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pr-1">Rol:</span>
                {[
                  { id: 'TODOS', label: 'Todos los Roles' },
                  { id: 'ADMINISTRADOR', label: 'Administradores' },
                  { id: 'GERENTE', label: 'Gerentes' },
                  { id: 'VENDEDOR', label: 'Vendedores' },
                  { id: 'ANALISTA', label: 'Analistas' },
                  { id: 'ALMACEN', label: 'Almacén' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setFiltroRol(r.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      filtroRol === r.id
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User List */}
            {cargandoUsuarios ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                <span className="text-xs font-medium">Consultando directorio empresarial de usuarios...</span>
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-1">
                <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">No se encontraron usuarios</p>
                <p className="text-xs text-slate-400">Prueba ajustando los criterios de búsqueda o filtros.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50/70 border-y border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Colaborador / Identidad</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Roles Asignados</th>
                      <th className="py-2.5 px-3">Fecha Registro</th>
                      <th className="py-2.5 px-3">Último Acceso</th>
                      <th className="py-2.5 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuariosFiltrados.map((u) => {
                      const estaProcesando = procesandoId === u.id;
                      const esPropioUsuario = currentUser?.id === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sky-700 shrink-0">
                                {u.nombre_completo.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                                  {u.nombre_completo}
                                  {esPropioUsuario && (
                                    <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-1.5 py-0.2 rounded">
                                      Tú
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {u.correo_electronico}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {u.activo ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Inactivo
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {u.roles.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">Sin roles</span>
                              ) : (
                                u.roles.map((r) => (
                                  <span
                                    key={r}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                      r.toUpperCase().includes('ADMIN')
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : r.toUpperCase().includes('GERENTE')
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : r.toUpperCase().includes('ALMACEN')
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : r.toUpperCase().includes('ANALISTA')
                                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    {r}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(u.creado_en).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {u.ultimo_acceso ? (
                              <div className="flex items-center gap-1 text-slate-600">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {new Date(u.ultimo_acceso).toLocaleString()}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">Nunca</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Asignar Roles */}
                              <button
                                onClick={() => abrirModalRoles(u)}
                                disabled={estaProcesando}
                                className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Editar roles asignados"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Configurar / Cambiar Contraseña */}
                              <button
                                onClick={() => abrirModalPassword(u)}
                                disabled={estaProcesando}
                                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Configurar o cambiar contraseña de acceso"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Activar / Desactivar */}
                              <button
                                onClick={() => handleToggleEstadoUsuario(u)}
                                disabled={estaProcesando}
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                                  u.activo
                                    ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                } disabled:opacity-50`}
                                title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                              >
                                {estaProcesando ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : u.activo ? (
                                  'Desactivar'
                                ) : (
                                  'Activar'
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB: SOLICITUDES DE ACCESO                                            */}
      {/* ==================================================================== */}
      {activeTab === 'solicitudes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                Solicitudes de Acceso Empresarial Pendientes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Revisa a los colaboradores registrados en Supabase Auth y autorízales los roles empresariales.
              </p>
            </div>
            <button
              onClick={cargarSolicitudes}
              disabled={cargandoSolicitudes}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargandoSolicitudes ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {cargandoSolicitudes ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
              <span className="text-xs font-medium">Consultando solicitudes en la base de datos...</span>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800">No hay solicitudes pendientes</p>
              <p className="text-xs text-slate-500">Todos los usuarios registrados han sido gestionados o aprobados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudes.map((sol) => {
                const seleccionados = rolesSeleccionados[sol.id] || [3];
                const estaProcesando = procesandoId === sol.id;

                return (
                  <div
                    key={sol.id}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{sol.nombre_completo}</span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                            {sol.estado}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {sol.correo_electronico}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(sol.creado_en).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleRechazarSolicitud(sol.id)}
                          disabled={estaProcesando}
                          className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleAprobarSolicitud(sol.id)}
                          disabled={estaProcesando || seleccionados.length === 0}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                        >
                          {estaProcesando ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Aprobar y Asignar Roles
                        </button>
                      </div>
                    </div>

                    {/* Selector de Roles a asignar */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                        Roles a Autorizar (un usuario puede tener múltiples roles):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                        {rolesDisponibles.map((r) => {
                          const estaMarcado = seleccionados.includes(r.id);
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => toggleRolSolicitud(sol.id, r.id)}
                              className={`p-2 rounded-lg border text-left transition-all text-xs flex flex-col justify-between ${
                                estaMarcado
                                  ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-bold text-[11px]">{r.codigo}</span>
                                <div
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                    estaMarcado
                                      ? 'bg-sky-600 border-sky-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {estaMarcado && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-500 leading-tight">
                                {r.nombre}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB: RBAC (Matriz de Roles & Permisos)                                */}
      {/* ==================================================================== */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Catálogo de Roles Oficiales (5 Roles)</h3>
                <p className="text-xs text-slate-500">Definición de perfiles funcionales según el PDF corporativo.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rolesDisponibles.map((r) => (
                <div
                  key={r.codigo}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">{r.codigo}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                        ID: {r.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-800 font-semibold">{r.nombre}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{r.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permisos Granulares */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Catálogo de 22 Permisos Granulares</h3>
                  <p className="text-xs text-slate-500">Seguridad por componente en FastAPI y React.</p>
                </div>
              </div>
              <button
                onClick={cargarCatalogoRbac}
                disabled={cargandoRbac}
                className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${cargandoRbac ? 'animate-spin' : ''}`} />
                Recargar
              </button>
            </div>

            {cargandoRbac ? (
              <div className="py-6 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                <span className="text-xs">Cargando catálogo...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {(permisosCatalogo.length > 0
                  ? permisosCatalogo
                  : [
                      { codigo: 'empresas:configurar', modulo: 'empresas', nombre: 'Configurar Empresa' },
                      { codigo: 'usuarios:administrar', modulo: 'usuarios', nombre: 'Administrar Usuarios' },
                      { codigo: 'roles:administrar', modulo: 'roles', nombre: 'Administrar Roles' },
                      { codigo: 'clientes:leer', modulo: 'clientes', nombre: 'Consultar Clientes' },
                      { codigo: 'clientes:escribir', modulo: 'clientes', nombre: 'Registrar Clientes' },
                      { codigo: 'productos:leer', modulo: 'productos', nombre: 'Consultar Catálogo' },
                      { codigo: 'productos:administrar', modulo: 'productos', nombre: 'Gestionar Catálogo' },
                      { codigo: 'inventario:leer', modulo: 'inventario', nombre: 'Consultar Existencias' },
                      { codigo: 'inventario:ajustar', modulo: 'inventario', nombre: 'Ajustar Inventario' },
                      { codigo: 'pedidos:crear', modulo: 'pedidos', nombre: 'Crear Pedidos' },
                      { codigo: 'pedidos:confirmar', modulo: 'pedidos', nombre: 'Confirmar Pedidos' },
                      { codigo: 'ventas:crear', modulo: 'ventas', nombre: 'Emitir Ventas' },
                      { codigo: 'ventas:anular', modulo: 'ventas', nombre: 'Anular Ventas' },
                      { codigo: 'pagos:registrar', modulo: 'pagos', nombre: 'Registrar Cobros' },
                      { codigo: 'personal:administrar', modulo: 'personal', nombre: 'Administrar Colaboradores' },
                      { codigo: 'analytics:ver', modulo: 'analytics', nombre: 'Ver Analytics' },
                      { codigo: 'probabilidad:calcular', modulo: 'probabilidades', nombre: 'Calcular Probabilidades' },
                      { codigo: 'insights:ver', modulo: 'insights', nombre: 'Ver Insights' },
                      { codigo: 'reportes:exportar', modulo: 'reportes', nombre: 'Exportar Reportes' },
                      { codigo: 'auditoria:consultar', modulo: 'auditoria', nombre: 'Ver Auditoría' }
                    ]
                ).map((p: any) => (
                  <div key={p.codigo} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-1 rounded font-bold">
                        {p.codigo}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {p.modulo}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 text-[11px]">{p.nombre}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB: GENERAL (Configuración Institucional)                             */}
      {/* ==================================================================== */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-sm text-slate-900">Datos Corporativos de la Empresa</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Razón Social</label>
                <input
                  type="text"
                  disabled
                  value="SalesIA Enterprise (Demostración)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Identificador Fiscal / RUC</label>
                  <input
                    type="text"
                    disabled
                    value="20608912345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Moneda Operativa</label>
                  <input
                    type="text"
                    disabled
                    value="USD (Dólares Americanos)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tasa de Impuesto</label>
                  <input
                    type="text"
                    disabled
                    value="18.00% (IGV)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Aislamiento Multi-Tenant</label>
                  <input
                    type="text"
                    disabled
                    value="company_id = 1 (Activo)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-emerald-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Seguridad & Autenticación Supabase</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Proyecto Supabase Oficial:</span>
                  <span className="font-mono text-[11px] text-slate-900 font-bold">
                    mvlsuvxwthaakfeqzkhy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Verificación Criptográfica:</span>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-mono text-[10px] font-bold">
                    Asimétrica ES256 / JWKS Oficial
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Anti-Enumeración de Cuentas:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                    <Check className="w-3.5 h-3.5" /> Habilitado
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Aprobación Obligatoria de Cuentas:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                    <Check className="w-3.5 h-3.5" /> Activo (solicitudes_acceso)
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Las contraseñas se almacenan y verifican exclusivamente en Supabase Auth. Los roles se determinan de forma estricta en PostgreSQL mediante la tabla usuarios_roles.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL PARA CAMBIO Y ASIGNACIÓN DE ROLES                             */}
      {/* ==================================================================== */}
      {usuarioEditando && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-900">Asignar Roles a Colaborador</h3>
              </div>
              <button
                onClick={() => setUsuarioEditando(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-800">{usuarioEditando.nombre_completo}</p>
              <p className="text-[11px] text-slate-500">{usuarioEditando.correo_electronico}</p>
            </div>

            {currentUser?.id === usuarioEditando.id && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Por seguridad corporativa, un usuario no puede modificar sus propios roles.</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                Seleccione los roles autorizados:
              </label>
              <div className="space-y-2">
                {rolesDisponibles.map((r) => {
                  const seleccionado = rolesUsuarioEditando.includes(r.id);
                  const deshabilitado = currentUser?.id === usuarioEditando.id;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={deshabilitado}
                      onClick={() => toggleRolUsuarioEditando(r.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        seleccionado
                          ? 'border-sky-500 bg-sky-50/70 text-sky-950'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      } ${deshabilitado ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div>
                        <p className="font-bold text-xs">{r.nombre} ({r.codigo})</p>
                        <p className="text-[10px] text-slate-500">{r.descripcion}</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          seleccionado ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {seleccionado && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                className="w-1/2 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoRoles || currentUser?.id === usuarioEditando.id}
                onClick={handleGuardarRolesUsuario}
                className="w-1/2 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {guardandoRoles ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar Roles'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL PARA CONFIGURACIÓN / CAMBIO DE CONTRASEÑA                    */}
      {/* ==================================================================== */}
      {usuarioPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Configurar Contraseña de Acceso</h3>
                  <p className="text-[11px] text-slate-500">Gobernanza de credenciales para el colaborador</p>
                </div>
              </div>
              <button
                onClick={() => setUsuarioPasswordModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Info Colaborador */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Colaborador:</span>
                <span className="font-bold text-slate-900">{usuarioPasswordModal.nombre_completo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Correo Electrónico:</span>
                <span className="font-mono text-slate-700">{usuarioPasswordModal.correo_electronico}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Roles:</span>
                <div className="flex gap-1">
                  {usuarioPasswordModal.roles.map((r) => (
                    <span key={r} className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Formulario de Contraseña */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700">Nueva Contraseña</label>
                <button
                  type="button"
                  onClick={() => {
                    const pass = generarPasswordSegura();
                    setNuevaPassword(pass);
                    setConfirmarPassword(pass);
                    setMostrarPassword(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  Generar Segura
                </button>
              </div>

              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres (A-Z, 0-9, @#$)"
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs text-slate-900 font-mono tracking-wide focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Indicador de Fortaleza */}
              {nuevaPassword && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Nivel de Seguridad:</span>
                    <span className={`font-bold ${evaluarFuerzaPassword(nuevaPassword).text}`}>
                      {evaluarFuerzaPassword(nuevaPassword).nivel}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${evaluarFuerzaPassword(nuevaPassword).color}`}
                      style={{ width: `${evaluarFuerzaPassword(nuevaPassword).porcentaje}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Confirmar Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Confirmar Contraseña</label>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs text-slate-900 font-mono tracking-wide focus:outline-none transition-all"
                />
              </div>

              {nuevaPassword && confirmarPassword && nuevaPassword !== confirmarPassword && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Las contraseñas no coinciden.
                </p>
              )}
            </div>

            <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              El usuario podrá iniciar sesión inmediatamente con esta clave. Las contraseñas se almacenan con cifrado de grado bancario.
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUsuarioPasswordModal(null)}
                className="w-1/2 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoPassword || !nuevaPassword || nuevaPassword !== confirmarPassword}
                onClick={handleGuardarPassword}
                className="w-1/2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {guardandoPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Actualizar Clave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL PARA CREAR NUEVO USUARIO / COLABORADOR                        */}
      {/* ==================================================================== */}
      {abrirModalNuevoUsuario && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleCrearUsuario}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Registrar Nuevo Colaborador</h3>
                  <p className="text-[11px] text-slate-500">Alta administrativa directa de cuenta y rol</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbrirModalNuevoUsuario(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Roberto Sánchez López"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Correo Electrónico Corporativo</label>
                <input
                  type="email"
                  required
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono Móvil (Opcional)</label>
                <input
                  type="text"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rol Corporativo Asignado</label>
                <select
                  value={nuevoRol}
                  onChange={(e) => setNuevoRol(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="VENDEDOR">Vendedor Comercial</option>
                  <option value="GERENTE">Gerente de Operaciones</option>
                  <option value="ADMINISTRADOR">Administrador del Sistema</option>
                  <option value="ANALISTA">Analista BI & Datos</option>
                  <option value="ALMACEN">Almacén & Logística</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700">Contraseña de Inicio</label>
                  <button
                    type="button"
                    onClick={() => setNuevaUserPassword(generarPasswordSegura())}
                    className="text-[11px] text-sky-600 hover:text-sky-700 flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Generar
                  </button>
                </div>
                <input
                  type="text"
                  value={nuevaUserPassword}
                  onChange={(e) => setNuevaUserPassword(e.target.value)}
                  placeholder="Dejar en blanco para autogenerar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAbrirModalNuevoUsuario(false)}
                className="w-1/2 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creandoUsuario}
                className="w-1/2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {creandoUsuario ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Registrar Colaborador'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
