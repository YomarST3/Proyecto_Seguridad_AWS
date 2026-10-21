import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Shield,
  Search,
  Lock,
  Hash,
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
  Filter,
  UserCheck,
  Package,
  BarChart3,
  UserCog
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserAvatar, extractUsernameFromEmail } from '../../lib/userAvatar';
import {
  getMessagesByChannel,
  sendChatMessage,
  ChatMessage,
  CURRENT_TAB_ID,
  deduplicateMessages,
} from '../../services/chatService';

interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: string[]; // Roles que pueden acceder
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'general',
    name: 'Canal General',
    description: 'Comunicaciones abiertas para todos los usuarios con rol empresarial asignado.',
    icon: Hash,
    allowedRoles: ['ADMINISTRADOR', 'GERENTE', 'VENDEDOR', 'ANALISTA', 'ALMACEN', 'ADMIN'],
  },
  {
    id: 'vendedores',
    name: 'Equipo de Vendedores',
    description: 'Canal exclusivo para vendedores y supervisión de ventas.',
    icon: UserCheck,
    allowedRoles: ['VENDEDOR', 'GERENTE', 'ADMINISTRADOR', 'ADMIN'],
  },
  {
    id: 'administracion',
    name: 'Dirección & Gobierno',
    description: 'Coordinación ejecutiva, políticas y auditoría de administración.',
    icon: Shield,
    allowedRoles: ['ADMINISTRADOR', 'GERENTE', 'ADMIN'],
  },
  {
    id: 'analistas',
    name: 'Analistas & Modelos',
    description: 'Discusión técnica sobre predicciones, métricas y seguridad probabilística.',
    icon: BarChart3,
    allowedRoles: ['ANALISTA', 'ADMINISTRADOR', 'ADMIN'],
  },
  {
    id: 'almacen',
    name: 'Almacén & Inventario',
    description: 'Coordinación logística, recepción de existencias y despachos.',
    icon: Package,
    allowedRoles: ['ALMACEN', 'GERENTE', 'ADMINISTRADOR', 'ADMIN'],
  },
];

// Miembros oficiales del sistema sincronizados con la Base de Datos empresarial
const TEAM_MEMBERS = [
  { id: 'pedro_vendedor', name: 'Pedro Torres Castillo', email: 'pedrotorrescastillo6@gmail.com', role: 'VENDEDOR', online: true },
  { id: 'jhon_vendedor', name: 'Jhon Gonzales', email: 'jhonssj006@gmail.com', role: 'VENDEDOR', online: true },
  { id: 'anderson_vendedor', name: 'Anderson Aponte', email: 'andersonaponte720@gmail.com', role: 'VENDEDOR', online: true },
  { id: 'victor_gerente', name: 'Víctor Jesús Obrero', email: 'victorjesusobrero@gmail.com', role: 'GERENTE', online: true },
  { id: 'franchesco_admin', name: 'Franchesco Alexander', email: 'franchescoalexanderj@gmail.com', role: 'ADMINISTRADOR', online: true },
  { id: 'frann_analista', name: 'Frann Juarez', email: 'frannjuarez6@gmail.com', role: 'ANALISTA', online: false },
  { id: 'almacen_equipo', name: 'Equipo Almacén Central', email: 'pruebas.salesia@gmail.com', role: 'ALMACEN', online: true },
];

export const ChatPage: React.FC = () => {
  const { user } = useAuth();

  // Roles del usuario autenticado normalizados
  const realUserRoles: string[] = useMemo(() => {
    if (!user) return [];
    if (user.roles && user.roles.length > 0) return user.roles.map((r) => r.toUpperCase());
    if (user.role) return [user.role.toUpperCase()];
    return [];
  }, [user]);

  const hasAnyRole = realUserRoles.length > 0 && !realUserRoles.includes('SIN_ROLES') && !realUserRoles.includes('SOLICITUD_PENDIENTE');

  // Selector de identidad para pruebas directas en frontend entre usuarios y roles
  const [activePersonaId, setActivePersonaId] = useState<string>('MY_USER');

  // Identidad emisora activa (cuenta real o persona simulada de prueba)
  const currentSender = useMemo(() => {
    if (activePersonaId === 'MY_USER' || !activePersonaId) {
      return {
        id: user?.id || 'usr-current',
        name: user?.full_name || extractUsernameFromEmail(user?.email),
        email: user?.email || 'yo@salesia.com',
        role: realUserRoles[0] || 'ADMINISTRADOR',
      };
    }
    const member = TEAM_MEMBERS.find((m) => m.id === activePersonaId);
    if (member) {
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
      };
    }
    return {
      id: user?.id || 'usr-current',
      name: user?.full_name || extractUsernameFromEmail(user?.email),
      email: user?.email || 'yo@salesia.com',
      role: realUserRoles[0] || 'ADMINISTRADOR',
    };
  }, [activePersonaId, user, realUserRoles]);

  // Roles efectivos según la persona seleccionada
  const effectiveRoles = useMemo(() => {
    return [currentSender.role.toUpperCase()];
  }, [currentSender.role]);

  // Canales autorizados según los roles
  const availableChannels = useMemo(() => {
    if (!hasAnyRole) return [];
    return CHANNELS.filter((ch) =>
      ch.allowedRoles.some((allowed) =>
        effectiveRoles.some((ur) => ur.includes(allowed) || allowed.includes(ur))
      )
    );
  }, [hasAnyRole, effectiveRoles]);

  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [targetRole, setTargetRole] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Cargar y deduplicar mensajes del canal activo
  const loadMessages = async (canalId: string) => {
    const list = await getMessagesByChannel(canalId);
    setMessages(deduplicateMessages(list));
  };

  useEffect(() => {
    if (availableChannels.length > 0) {
      if (!availableChannels.some((c) => c.id === activeChannelId)) {
        setActiveChannelId(availableChannels[0].id);
      }
    }
  }, [availableChannels, activeChannelId]);

  useEffect(() => {
    if (hasAnyRole && activeChannelId) {
      loadMessages(activeChannelId);
    }
  }, [hasAnyRole, activeChannelId]);

  // Sincronización en tiempo real sin backend pesado: BroadcastChannel + evento Storage
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('salesia_chat_channel');
        bc.onmessage = (event) => {
          // Ignorar ecos generados por esta misma pestaña (evita mensaje doble)
          if (event.data?.senderTabId === CURRENT_TAB_ID) return;

          if (event.data?.type === 'NEW_MESSAGE' && event.data.message?.canal === activeChannelId) {
            setMessages((prev) => deduplicateMessages([...prev, event.data.message]));
          }
        };
      }
    } catch { /* ignore */ }

    // Sincronización multi-pestaña usando evento nativo de storage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'salesia_enterprise_chat_messages') {
        loadMessages(activeChannelId);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeChannelId]);

  // Desplazamiento automático al final de la conversación
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeChannel = CHANNELS.find((c) => c.id === activeChannelId) || CHANNELS[0];

  // Enviar mensaje con protección contra doble clic y doble envío
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || sending) return;

    // Limpiar inmediatamente el input de forma síncrona para evitar doble mensaje por tecla Enter o doble clic
    setInputText('');
    setSending(true);

    try {
      const created = await sendChatMessage({
        canal: activeChannelId,
        usuario_id: currentSender.id,
        remitente_nombre: currentSender.name,
        remitente_correo: currentSender.email,
        remitente_rol: currentSender.role,
        rol_destino: targetRole === 'TODOS' ? null : targetRole,
        contenido: textToSend,
      });

      // Deduplicar estrictamente al actualizar el estado local
      setMessages((prev) => deduplicateMessages([...prev, created]));
    } catch (err) {
      console.error('Error al enviar mensaje en chat:', err);
    } finally {
      setSending(false);
    }
  };


  // Filtrado de mensajes según búsqueda
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase().trim();
    return messages.filter(
      (m) =>
        m.contenido.toLowerCase().includes(q) ||
        m.remitente_nombre.toLowerCase().includes(q) ||
        m.remitente_rol.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  // Color de etiqueta según rol (Colores neutros empresariales)
  const getRoleBadgeStyle = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes('ADMIN')) {
      return 'bg-slate-800 border-slate-700 text-blue-300';
    }
    if (r.includes('GERENTE')) {
      return 'bg-slate-800 border-slate-700 text-sky-300';
    }
    if (r.includes('VENDEDOR')) {
      return 'bg-slate-800 border-slate-700 text-emerald-300';
    }
    if (r.includes('ANALISTA')) {
      return 'bg-slate-800 border-slate-700 text-indigo-300';
    }
    if (r.includes('ALMACEN')) {
      return 'bg-slate-800 border-slate-700 text-amber-300';
    }
    return 'bg-slate-800 border-slate-700 text-slate-300';
  };

  // =========================================================================
  // BLOQUEO: USUARIOS SIN ROLES NO PUEDEN ACCEDER AL CHAT
  // =========================================================================
  if (!hasAnyRole) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mb-2">
            Canal de Comunicación Restringido
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            Para acceder al <strong>Chat Global</strong> y los canales internos por departamento, tu cuenta debe poseer un rol empresarial activo (Administrador, Gerente, Vendedor, Analista o Almacén) autorizado por la administración.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Estado actual: Cuenta sin asignación de roles.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col antialiased">
      {/* Contenedor principal del chat empresarial */}
      <div className="flex-1 flex overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        
        {/* =================================================================== */}
        {/* PANEL LATERAL: CANALES Y DIRECTORIO DE EQUIPO                       */}
        {/* =================================================================== */}
        <aside className="w-72 sm:w-80 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0">
          
          {/* Cabecera del panel lateral */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Comunicaciones
                </h3>
                <span className="text-[11px] text-slate-400">Canales & Roles</span>
              </div>
            </div>
          </div>

          {/* Lista de Canales Disponibles */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1.5">
                Canales Autorizados ({availableChannels.length})
              </span>
              <div className="space-y-1">
                {availableChannels.map((ch) => {
                  const Icon = ch.icon;
                  const isActive = ch.id === activeChannelId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 border border-slate-700 text-slate-100 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{ch.name}</span>
                        <span className="text-[10px] text-slate-500 block truncate font-normal">
                          {ch.id === 'general' ? 'Visible para todos los roles' : `Para: ${ch.allowedRoles.slice(0, 2).join(', ')}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Directorio de Roles de la Empresa */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-2">
                Miembros del Sistema
              </span>
              <div className="space-y-1.5">
                {TEAM_MEMBERS.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-xs transition-colors"
                  >
                    <div className="relative">
                      <UserAvatar nameOrEmail={member.email} size="xs" showGlow={false} />
                      {member.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-slate-200 text-[11px] font-medium truncate">
                        {member.name}
                      </span>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pie de perfil del usuario emisor activo */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/40 flex items-center gap-2.5">
            <UserAvatar nameOrEmail={currentSender.email} size="sm" showGlow={false} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="block text-xs font-semibold text-slate-200 truncate">
                  {currentSender.name}
                </span>
                {activePersonaId !== 'MY_USER' && (
                  <span className="text-[9px] bg-slate-800 text-blue-400 px-1 rounded border border-slate-700">
                    Simulado
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">
                {currentSender.role}
              </span>
            </div>
          </div>

        </aside>

        {/* =================================================================== */}
        {/* ÁREA PRINCIPAL: CONVERSACIÓN DEL CANAL                              */}
        {/* =================================================================== */}
        <section className="flex-1 flex flex-col bg-slate-900/90 overflow-hidden">
          
          {/* Barra superior del canal */}
          <header className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                <activeChannel.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-100 truncate">
                    {activeChannel.name}
                  </h2>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {activeChannel.id === 'general' ? 'Global Empresarial' : 'Exclusivo por Rol'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeChannel.description}
                </p>
              </div>
            </div>

            {/* Buscador dentro del canal */}
            <div className="relative w-44 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar mensajes..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </header>

          {/* Contenedor con lista de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <MessageSquare className="w-10 h-10 mb-2 text-slate-700" />
                <p className="text-xs font-medium text-slate-400">
                  {searchQuery ? 'No se encontraron mensajes con ese criterio.' : 'No hay mensajes aún en este canal.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sé el primero en iniciar la coordinación en #{activeChannel.id}.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.remitente_correo.toLowerCase() === currentSender.email.toLowerCase();
                const timeString = new Date(msg.creado_en).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <UserAvatar nameOrEmail={msg.remitente_correo} size="sm" showGlow={false} />
                    
                    <div className={`max-w-[75%] sm:max-w-[65%] space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                      
                      {/* Cabecera del mensaje */}
                      <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                        <span className="font-semibold text-slate-200">
                          {msg.remitente_nombre}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-medium ${getRoleBadgeStyle(msg.remitente_rol)}`}>
                          {msg.remitente_rol}
                        </span>
                        {msg.rol_destino && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                            Para: {msg.rol_destino}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {timeString}
                        </span>
                      </div>

                      {/* Burbuja del mensaje */}
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed break-words text-left ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-xs shadow-sm'
                            : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-xs shadow-sm'
                        }`}
                      >
                        {msg.contenido}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* =================================================================== */}
          {/* BARRA INFERIOR DE ENVÍO DE MENSAJES                                 */}
          {/* =================================================================== */}
          <footer className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950">
            <form onSubmit={handleSendMessage} className="space-y-2.5">
              
              {/* Opciones de Remitente y Destinatario de rol */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Selector de Usuario Emisor para pruebas directas en frontend */}
                  <div className="flex items-center gap-1.5">
                    <UserCog className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px] text-slate-400">Escribir como:</span>
                    <select
                      value={activePersonaId}
                      onChange={(e) => setActivePersonaId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-slate-600"
                    >
                      <option value="MY_USER">
                        Mi Cuenta ({user?.full_name || extractUsernameFromEmail(user?.email)} - {realUserRoles[0] || 'ADMIN'})
                      </option>
                      <option value="pedro_vendedor">Pedro Torres Castillo (Vendedor 1)</option>
                      <option value="jhon_vendedor">Jhon Gonzales (Vendedor 2)</option>
                      <option value="anderson_vendedor">Anderson Aponte (Vendedor 3)</option>
                      <option value="victor_gerente">Víctor Jesús Obrero (Gerente)</option>
                      <option value="franchesco_admin">Franchesco Alexander (Administrador)</option>
                      <option value="frann_analista">Frann Juarez (Analista)</option>
                      <option value="almacen_equipo">Equipo Almacén Central (Almacén)</option>
                    </select>
                  </div>

                  {/* Selector de rol de destino opcional */}
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] text-slate-400">Dirigir a:</span>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-slate-600"
                    >
                      <option value="TODOS">Todo el canal ({activeChannel.name})</option>
                      <option value="VENDEDOR">Solo Vendedores</option>
                      <option value="ADMINISTRADOR">Solo Administradores</option>
                      <option value="ANALISTA">Solo Analistas</option>
                      <option value="ALMACEN">Solo Almacén</option>
                    </select>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  Presiona Enter para enviar
                </span>
              </div>

              {/* Campo de texto y botón enviar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Escribe un mensaje como ${currentSender.name} en #${activeChannel.id}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-slate-600 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed"
                >
                  <span>Enviar</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>
          </footer>

        </section>

      </div>
    </div>
  );
};

export default ChatPage;

