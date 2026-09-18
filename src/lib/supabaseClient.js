import { createClient } from '@supabase/supabase-js';

/**
 * Resolve env vars for both Vite (import.meta.env) and Next-style names.
 * Vite also exposes NEXT_PUBLIC_* when envPrefix includes it (see vite.config.js).
 */
function readEnv(viteKey, nextKey) {
  const meta = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const fromVite = meta?.[viteKey] || meta?.[nextKey];
  const fromProcess =
    typeof process !== 'undefined'
      ? process.env?.[viteKey] || process.env?.[nextKey]
      : undefined;
  return (fromVite || fromProcess || '').trim();
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[Toucano Beans] Supabase env vars missing. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_* equivalents) in .env.local.'
  );
}

/**
 * Safe client: uses real credentials when present; otherwise a non-crashing
 * placeholder so the UI can still render and show auth/error states.
 */
const clientUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const clientKey = isSupabaseConfigured ? supabaseAnonKey : 'public-anon-key';

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
});
