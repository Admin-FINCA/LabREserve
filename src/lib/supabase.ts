import { createClient } from '@supabase/supabase-js';

// Usamos valores por defecto vacíos para evitar errores al evaluar import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// No lanzamos error aquí para permitir que la App de React cargue y muestre un mensaje amigable
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
