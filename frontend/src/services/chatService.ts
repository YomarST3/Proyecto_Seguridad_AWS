import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  canal: string;
  usuario_id?: string;
  remitente_nombre: string;
  remitente_correo: string;
  remitente_rol: string;
  rol_destino?: string | null;
  contenido: string;
  creado_en: string;
}

export interface SendMessageData {
  canal: string;
  usuario_id?: string;
  remitente_nombre: string;
  remitente_correo: string;
  remitente_rol: string;
  rol_destino?: string | null;
  contenido: string;
}

const LOCAL_STORAGE_KEY = 'salesia_enterprise_chat_messages';

// Identificador único de la pestaña actual para evitar ecos o mensajes duplicados
export const CURRENT_TAB_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// Mensajes iniciales de demostración para los diferentes canales y roles
// Mensajes iniciales con los usuarios reales registrados en la Base de Datos
const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'seed-1',
    canal: 'general',
    remitente_nombre: 'Franchesco Alexander',
    remitente_correo: 'franchescoalexanderj@gmail.com',
    remitente_rol: 'ADMINISTRADOR',
    rol_destino: null,
    contenido: 'Bienvenidos al canal general de SalesIA. Todos los módulos operativos y roles han sido sincronizados con la base de datos empresarial.',
    creado_en: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'seed-2',
    canal: 'general',
    remitente_nombre: 'Víctor Jesús Obrero',
    remitente_correo: 'victorjesusobrero@gmail.com',
    remitente_rol: 'GERENTE',
    rol_destino: null,
    contenido: 'Buenas tardes al equipo. Por favor verificar los cierres de turno y reportes de inventario.',
    creado_en: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'seed-3',
    canal: 'vendedores',
    remitente_nombre: 'Víctor Jesús Obrero',
    remitente_correo: 'victorjesusobrero@gmail.com',
    remitente_rol: 'GERENTE',
    rol_destino: 'VENDEDOR',
    contenido: 'Equipo comercial: Pedro, Jhon y Anderson, tenemos nuevos clientes registrados en la plataforma para seguimiento.',
    creado_en: new Date(Date.now() - 2700000).toISOString(),
  },
  {
    id: 'seed-4',
    canal: 'vendedores',
    remitente_nombre: 'Pedro Torres Castillo',
    remitente_correo: 'pedrotorrescastillo6@gmail.com',
    remitente_rol: 'VENDEDOR',
    rol_destino: null,
    contenido: 'Entendido Víctor. Ya contacté a los clientes de la zona norte y registré las órdenes correspondientes.',
    creado_en: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'seed-5',
    canal: 'vendedores',
    remitente_nombre: 'Jhon Gonzales',
    remitente_correo: 'jhonssj006@gmail.com',
    remitente_rol: 'VENDEDOR',
    rol_destino: null,
    contenido: 'Confirmado por aquí también. Las cotizaciones de la cartera corporativa están enviadas.',
    creado_en: new Date(Date.now() - 1400000).toISOString(),
  },
  {
    id: 'seed-6',
    canal: 'analistas',
    remitente_nombre: 'Frann Juarez',
    remitente_correo: 'frannjuarez6@gmail.com',
    remitente_rol: 'ANALISTA',
    rol_destino: null,
    contenido: 'El modelo bayesiano de probabilidad ha actualizado el cálculo de riesgo con 98.4% de confianza.',
    creado_en: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'seed-7',
    canal: 'almacen',
    remitente_nombre: 'Equipo Almacén Central',
    remitente_correo: 'pruebas.salesia@gmail.com',
    remitente_rol: 'ALMACEN',
    rol_destino: null,
    contenido: 'Recepción de stock completada en bodega central. Las unidades están listas para despacho.',
    creado_en: new Date(Date.now() - 900000).toISOString(),
  },
];


/** Función de deduplicación estricta de mensajes con ventana de tiempo deslizante */
export function deduplicateMessages(list: ChatMessage[]): ChatMessage[] {
  const clean: ChatMessage[] = [];
  const seenIds = new Set<string>();

  for (const m of list) {
    if (!m || !m.id) continue;
    if (seenIds.has(m.id)) continue;

    // Detectar si ya existe un mensaje idéntico (mismo canal, mismo remitente, mismo contenido) en un intervalo menor a 3.5 segundos
    const mTime = new Date(m.creado_en).getTime();
    const isDuplicate = clean.some((existing) => {
      if (
        existing.canal === m.canal &&
        existing.remitente_correo?.toLowerCase() === m.remitente_correo?.toLowerCase() &&
        existing.contenido.trim() === m.contenido.trim()
      ) {
        const existingTime = new Date(existing.creado_en).getTime();
        return Math.abs(mTime - existingTime) < 3500;
      }
      return false;
    });

    if (isDuplicate) continue;

    seenIds.add(m.id);
    clean.push(m);
  }

  // Ordenar cronológicamente
  return clean.sort((a, b) => new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime());
}

/** Obtiene todos los mensajes en memoria local */
export function getLocalCache(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateMessages(parsed);
      }
    }
  } catch { /* ignore */ }

  // Inicializar con mensajes semilla predeterminados
  saveLocalCache(SEED_MESSAGES);
  return SEED_MESSAGES;
}

/** Guarda los mensajes deduplicados en memoria local */
export function saveLocalCache(messages: ChatMessage[]) {
  try {
    const deduplicated = deduplicateMessages(messages);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(deduplicated));
  } catch { /* ignore */ }
}

/** Obtiene los mensajes para un canal específico (Frontend directo y ultra rápido) */
export async function getMessagesByChannel(canal: string): Promise<ChatMessage[]> {
  const localAll = getLocalCache();
  const channelLocal = localAll.filter((m) => m.canal === canal);

  // Opcional: sincronización pasiva con Supabase en segundo plano si existe la tabla
  try {
    Promise.resolve(
      supabase
        .from('mensajes_chat')
        .select('*')
        .eq('canal', canal)
        .order('creado_en', { ascending: true })
    )
      .then((res: any) => {
        const data = res?.data;
        const error = res?.error;
        if (!error && data && data.length > 0) {
          const current = getLocalCache();
          const merged = deduplicateMessages([...current, ...data]);
          saveLocalCache(merged);
        }
      })
      .catch(() => {});
  } catch { /* ignore */ }

  return channelLocal;
}

/** Envía un nuevo mensaje al canal (100% reactivo en Frontend) */
export async function sendChatMessage(data: SendMessageData): Promise<ChatMessage> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const newMsg: ChatMessage = {
    id: messageId,
    canal: data.canal,
    usuario_id: data.usuario_id || '',
    remitente_nombre: data.remitente_nombre,
    remitente_correo: data.remitente_correo,
    remitente_rol: data.remitente_rol,
    rol_destino: data.rol_destino || null,
    contenido: data.contenido.trim(),
    creado_en: new Date().toISOString(),
  };

  // 1. Guardar en memoria local
  const current = getLocalCache();
  const updated = deduplicateMessages([...current, newMsg]);
  saveLocalCache(updated);

  // 2. Transmitir a otras pestañas mediante BroadcastChannel (con identificador de pestaña para no auto-recibirse)
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('salesia_chat_channel');
      bc.postMessage({
        type: 'NEW_MESSAGE',
        message: newMsg,
        senderTabId: CURRENT_TAB_ID,
      });
      bc.close();
    }
  } catch { /* ignore */ }

  // 3. Sincronización asíncrona silenciosa en base de datos si está conectada (sin esperar respuesta)
  try {
    Promise.resolve(
      supabase
        .from('mensajes_chat')
        .insert({
          id: newMsg.id,
          canal: newMsg.canal,
          usuario_id: newMsg.usuario_id || null,
          remitente_nombre: newMsg.remitente_nombre,
          remitente_correo: newMsg.remitente_correo,
          remitente_rol: newMsg.remitente_rol,
          rol_destino: newMsg.rol_destino || null,
          contenido: newMsg.contenido,
          creado_en: newMsg.creado_en,
        })
    ).catch(() => {});
  } catch { /* ignore */ }

  return newMsg;
}


