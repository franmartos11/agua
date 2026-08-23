import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Sin tipar hasta generar lib/supabase/types.ts (ver ese archivo).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se llama desde un Server Component sin permiso de escritura de cookies.
            // Es inofensivo si proxy.ts refresca la sesión en cada request.
          }
        },
      },
    },
  );
}
