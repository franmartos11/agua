import { createBrowserClient } from "@supabase/ssr";

// Sin tipar hasta generar lib/supabase/types.ts (ver ese archivo).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
