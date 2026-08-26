import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PREFIX = "/admin";
const OWNER_PREFIX = "/propietario";
const PUBLIC_PATHS = ["/login", "/auth"];
// Autenticadas con CRON_SECRET en el header Authorization, no con sesión de usuario.
const CRON_PREFIX = "/api/cron";

export async function updateSession(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith(CRON_PREFIX)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const { data: perfil } = await supabase
      .from("perfil")
      .select("rol")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = perfil?.rol === "admin" ? `${ADMIN_PREFIX}` : `${OWNER_PREFIX}`;
    return NextResponse.redirect(url);
  }

  return response;
}
