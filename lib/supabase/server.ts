import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Memoizado con React.cache: todos los Server Components de un mismo request
 * (layout + page + los que sean) comparten esta misma instancia en vez de
 * crear un GoTrueClient por cada uno. Si no, cada uno intenta refrescar la
 * sesión por su cuenta cuando el access token está por vencer, y como el
 * refresh token de Supabase es de un solo uso, dos refrescos en paralelo
 * dentro del mismo request "queman" el token sin que ninguno pueda persistir
 * el nuevo (los Server Components no pueden escribir cookies) — la próxima
 * request ya no tiene ningún token válido y termina en /login.
 * Sin tipar hasta generar lib/supabase/types.ts (ver ese archivo).
 */
export const createClient = cache(async () => {
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
});
