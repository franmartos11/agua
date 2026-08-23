import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Usa la service role key: bypasea RLS por completo.
 * Nunca importar desde un Client Component ni exponer la key con NEXT_PUBLIC_.
 * Sin tipar hasta generar lib/supabase/types.ts (ver ese archivo).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
