import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-loaded client instance (avoids build-time errors when env vars not set)
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client for browser/client-side use
 * Lazily initialized to avoid build-time errors
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use getSupabase() instead
 */
export const supabase = {
  get from() {
    return getSupabase().from.bind(getSupabase());
  },
  get auth() {
    return getSupabase().auth;
  },
  get storage() {
    return getSupabase().storage;
  },
  get functions() {
    return getSupabase().functions;
  },
  get realtime() {
    return getSupabase().realtime;
  },
};

/**
 * Create Supabase client with service role for server-side operations
 */
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
