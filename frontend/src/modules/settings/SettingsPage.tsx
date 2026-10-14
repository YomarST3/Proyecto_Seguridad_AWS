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
  Check
} from 'lucide-react';
import api from '../../services/api';
import { SolicitudAcceso } from '../../types';

interface RolItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'solicitudes' | 'rbac'>('general');
  const [solicitudes, setSolicitudes] = useState<SolicitudAcceso[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [rolesSeleccionados, setRolesSeleccionados] = useState<Record<number, number[]>>({});
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const rolesDisponibles: RolItem[] = [
    { id: 1, codigo: 'ADMINISTRADOR', nombre: 'Administrador', descripcion: 'Control total de configuración, roles y auditoría sensible' },
    { id: 2, codigo: 'GERENTE', nombre: 'Gerente', descripcion: 'Supervisión comercial integral, reportes ejecutivos y metas' },
    { id: 3, codigo: 'VENDEDOR', nombre: 'Vendedor', descripcion: 'Gestión de clientes, catálogo, pedidos y ventas asignadas' },
    { id: 4, codigo: 'ANALISTA', nombre: 'Analista BI', descripcion: 'Exploración de datos, motor de probabilidades e insights de IA' },
    { id: 5, codigo: 'ALMACEN', nombre: 'Almacén', descripcion: 'Control de existencias físicas, movimientos y alertas de inventario' }
  ];

  const cargarSolicitudes = async () => {
    setCargandoSolicitudes(true);
    setMensajeError(null);
    try {
      const response = await api.get('/auth/solicitudes');
      setSolicitudes(response.data);
      // Inicializar roles seleccionados con VENDEDOR (id: 3) por defecto para cada solicitud
      const initialRoles: Record<number, number[]> = {};
      response.data.forEach((sol: SolicitudAcceso) => {
        initialRoles[sol.id] = [3]; // Default a VENDEDOR
      });
      setRolesSeleccionados(initialRoles);
    } catch (err: any) {
      console.error('Error cargando solicitudes:', err);
      // Si da 403, el usuario actual puede no tener permiso de usuarios:administrar
      if (err.response?.status === 403) {
        setMensajeError('No tienes permisos suficientes (usuarios:administrar) para ver o gestionar solicitudes.');
      } else {
        setMensajeError(err.response?.data?.detail || 'Error al conectar con el servidor.');
      }
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'solicitudes') {
      cargarSolicitudes();
    }
  }, [activeTab]);

  const toggleRol = (solicitudId: number, rolId: number) => {
    const actuales = rolesSeleccionados[solicitudId] || [];
    const yaTiene = actuales.includes(rolId);
    let nuevos: number[];

    if (yaTiene) {
      nuevos = actuales.filter((id) => id !== rolId);
      // No permitir desmarcar todos los roles
      if (nuevos.length === 0) return;
    } else {
      nuevos = [...actuales, rolId];
    }

    setRolesSeleccionados({
      ...rolesSeleccionados,
      [solicitudId]: nuevos
    });
  };

  const handleAprobar = async (solicitudId: number) => {
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
    } catch (err: any) {
      setMensajeError(err.response?.data?.detail || 'Error al aprobar solicitud de acceso.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (solicitudId: number) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            Configuración & Seguridad Empresarial
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Parámetros corporativos, gobernanza de identidades Supabase y matriz RBAC.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'solicitudes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-sky-600" />
            Solicitudes de Acceso
            {solicitudes.length > 0 && (
              <span className="bg-sky-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {solicitudes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'rbac'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matriz de Roles
          </button>
        </div>
      </div>

      {/* Notifications */}
      {mensajeExito && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* TAB: GENERAL */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Settings */}
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
                  value="SalesIA Tech Solutions S.A.C."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">RUC / Identificador Fiscal</label>
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
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Impuesto a las Ventas (Tax Rate)</label>
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

          {/* Security & Authentication Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Seguridad & Autenticación Supabase</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Motor de Identidades:</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold">
                    Supabase Auth + JWT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Verificación de Criptográfica:</span>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-mono text-[10px] font-bold">
                    HMAC-SHA256 / JWT Secret
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
                Las contraseñas nunca se guardan en la base de datos de la aplicación. Todo acceso exige un token JWT válido y una cuenta activa con roles asignados por un administrador.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SOLICITUDES DE ACCESO */}
      {activeTab === 'solicitudes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                Solicitudes de Acceso Empresarial Pendientes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Revisa a los colaboradores registrados en Supabase Auth y asígnales los roles autorizados.
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
                          onClick={() => handleRechazar(sol.id)}
                          disabled={estaProcesando}
                          className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleAprobar(sol.id)}
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
                              onClick={() => toggleRol(sol.id, r.id)}
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

      {/* TAB: RBAC */}
      {activeTab === 'rbac' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Matriz de Roles & Permisos (RBAC)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rolesDisponibles.map((r) => (
              <div
                key={r.codigo}
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono text-[11px]">{r.codigo}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                      ID: {r.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">{r.nombre}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.descripcion}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
