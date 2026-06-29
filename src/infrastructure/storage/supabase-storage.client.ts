import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabaseStorageClient: SupabaseClient | null | undefined;

export function getSupabaseStorageClient(): SupabaseClient | null {
  if (supabaseStorageClient !== undefined) {
    return supabaseStorageClient;
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[storage] SUPABASE_URL ou SUPABASE_SERVICE_KEY não configuradas — uploads serão ignorados');
    supabaseStorageClient = null;
    return supabaseStorageClient;
  }

  supabaseStorageClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseStorageClient;
}
