import { createClient } from '@supabase/supabase-js';

// Variables de entorno de Supabase oficiales (Proyecto_Empresarial_Estadistico)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mvlsuvxwthaakfeqzkhy.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_4LV8d2wOEio84iS0V9mnhg_XM-NZxQl';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
