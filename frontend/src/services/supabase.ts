import { createClient } from '@supabase/supabase-js';

// Variables de entorno de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-salesia.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_local_development_fallback';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
