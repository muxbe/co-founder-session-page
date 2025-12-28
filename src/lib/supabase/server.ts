import { createServerClient } from './client';

/**
 * Create Supabase client for server-side API routes
 * This is the recommended way to use Supabase in Next.js API routes
 */
export function createClient() {
  return createServerClient();
}
