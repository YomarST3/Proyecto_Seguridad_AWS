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
  Lock
} from 'lucide-react';
import api from '../../services/api';
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
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  
  // Modal de Roles para Usuario
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioEmpresarial | null>(null);
  const [rolesUsuarioEditando, setRolesUsuarioEditando] = useState<number[]>([]);
  const [guardandoRoles, setGuardandoRoles] = useState(false);

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
      const res = await api.get('/administracion/usuarios');
      setUsuarios(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setMensajeError('Se requiere el permiso "usuarios:administrar" para listar los usuarios.');
      } else {
        setMensajeError(err.response?.data?.detail || 'Error al cargar usuarios empresariales.');
      }
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const cargarSolicitudes = async () => {
    setCargandoSolicitudes(true);
    setMensajeError(null);
    try {
      const response = await api.get('/auth/solicitudes');
      setSolicitudes(response.data);
      const initialRoles: Record<number, number[]> = {};
      response.data.forEach((sol: SolicitudAcceso) => {
        initialRoles[sol.id] = [3]; // Default VENDEDOR
      });
      setRolesSeleccionados(initialRoles);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setMensajeError('Se requiere el permiso "usuarios:administrar" para gestionar solicitudes.');
      } else {
        setMensajeError(err.response?.data?.detail || 'Error al conectar con el servidor.');
      }
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  const cargarCatalogoRbac = async () => {
    setCargandoRbac(true);
    try {
      const [resRoles, resPermisos] = await Promise.all([
        api.get('/administracion/roles').catch(() => ({ data: [] })),
        api.get('/administracion/permisos').catch(() => ({ data: [] }))
      ]);
      setRolesCatalogo(resRoles.data);
      setPermisosCatalogo(resPermisos.data);
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
      const res = await api.post(`/auth/solicitudes/${solicitudId}/aprobar`, {
        roles_ids: rolesIds
      });
      setMensajeExito(res.data.mensaje || `Solicitud #${solicitudId} aprobada correctamente.`);
      await cargarSolicitudes();
      await cargarUsuarios();
    } catch (err: any) {
      setMensajeError(err.response?.data?.detail || 'Error al aprobar solicitud de acceso.');
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
      const res = await api.post(`/auth/solicitudes/${solicitudId}/rechazar`, {
        motivo: 'Solicitud declinada por el administrador corporativo.'
      });
      setMensajeExito(res.data.mensaje || `Solicitud #${solicitudId} rechazada.`);
      await cargarSolicitudes();
    } catch (err: any) {
      setMensajeError(err.response?.data?.detail || 'Error al rechazar solicitud.');
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
      await api.put(`/administracion/usuarios/${u.id}`, {
        activo: !u.activo
      });
      setMensajeExito(`Usuario ${u.nombre_completo} ${!u.activo ? 'activado' : 'desactivado'} con éxito.`);
      await cargarUsuarios();
    } catch (err: any) {
      setMensajeError(err.response?.data?.detail || 'No se pudo actualizar el estado del usuario.');
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
      await api.post(`/administracion/usuarios/${usuarioEditando.id}/roles`, {
        roles_ids: rolesUsuarioEditando
      });
      setMensajeExito(`Roles actualizados correctamente para ${usuarioEditando.nombre_completo}.`);
      setUsuarioEditando(null);
      await cargarUsuarios();
    } catch (err: any) {
      setMensajeError(err.response?.data?.detail || 'Error al actualizar roles.');
    } finally {
      setGuardandoRoles(false);
    }
  };

  // Filtrado de usuarios
  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroEstado === 'ACTIVOS' && !u.activo) return false;
    if (filtroEstado === 'INACTIVOS' && u.activo) return false;
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o rol..."
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-2">
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
                  onClick={cargarUsuarios}
                  disabled={cargandoUsuarios}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cargandoUsuarios ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
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
                <table className="w-full text-left text-xs">
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

                      <div className="flex items-center gap-2">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
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
    </div>
  );
};

export default SettingsPage;
