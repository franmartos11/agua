import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalcularMorosidad } from "@/lib/mora";

/**
 * Disparado por Vercel Cron (ver vercel.json). Corre sin sesión de usuario,
 * por eso usa la service role key en vez del cliente atado a cookies.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const actualizadas = await recalcularMorosidad(supabase);

  return NextResponse.json({ ok: true, actualizadas });
}
