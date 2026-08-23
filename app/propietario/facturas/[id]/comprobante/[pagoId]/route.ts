import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/propietario/facturas/[id]/comprobante/[pagoId]">,
) {
  const { id: facturaId, pagoId } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado", { status: 401 });
  }

  // Verificar que el pago pertenece a una factura del propietario autenticado.
  // RLS de SELECT en pago ya lo filtra, pero lo validamos explícitamente.
  const { data: pago } = await supabase
    .from("pago")
    .select("comprobante_url, factura:factura_id(lote:lote_id(propietario_id))")
    .eq("id", pagoId)
    .eq("factura_id", facturaId)
    .single();

  if (!pago || !pago.comprobante_url) {
    return new Response("Comprobante no encontrado", { status: 404 });
  }

  // Generar URL firmada válida por 60 segundos
  const { data: signedData, error } = await supabase.storage
    .from("comprobantes")
    .createSignedUrl(pago.comprobante_url, 60);

  if (error || !signedData) {
    return new Response("No se pudo generar el link de descarga", { status: 500 });
  }

  return Response.redirect(signedData.signedUrl);
}
