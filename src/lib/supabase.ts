
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseUrl = rawUrl
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
).trim();

export const isSupabaseConfigured =
  /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/.test(supabaseUrl) &&
  supabaseAnonKey.length > 0;

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured
    ? supabaseUrl
    : 'https://placeholder.supabase.co',
  isSupabaseConfigured
    ? supabaseAnonKey
    : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
