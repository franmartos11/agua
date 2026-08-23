"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcularRecargoMora } from "@/lib/facturacion";

export async function registrarPago(
  facturaId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const monto = Number(formData.get("monto"));
  const fecha = (formData.get("fecha") as string) || undefined;
  const metodo = formData.get("metodo") as string;
  const comprobante = formData.get("comprobante") as File | null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: factura } = await supabase
    .from("factura")
    .select("id, lote_id, monto_total, monto_pagado")
    .eq("id", facturaId)
    .single();

  if (!factura) return "Factura no encontrada.";

  let comprobante_url: string | null = null;
  if (comprobante && comprobante.size > 0) {
    const path = `${factura.lote_id}/${facturaId}/${Date.now()}-${comprobante.name}`;
    const { error: errorUpload } = await supabase.storage
      .from("comprobantes")
      .upload(path, comprobante);
    if (errorUpload) {
      return `No se pudo subir el comprobante: ${errorUpload.message}`;
    }
    comprobante_url = path;
  }

  const { error: errorPago } = await supabase.from("pago").insert({
    factura_id: facturaId,
    monto,
    fecha,
    metodo,
    comprobante_url,
    registrado_por: user?.id,
  });

  if (errorPago) {
    return `No se pudo registrar el pago: ${errorPago.message}`;
  }

  const nuevoMontoPagado = Number(factura.monto_pagado) + monto;
  const nuevoEstado = nuevoMontoPagado >= Number(factura.monto_total) ? "pagada" : "parcial";

  const { error: errorFactura } = await supabase
    .from("factura")
    .update({ monto_pagado: nuevoMontoPagado, estado: nuevoEstado })
    .eq("id", facturaId);

  if (errorFactura) {
    return `Pago registrado pero no se pudo actualizar la factura: ${errorFactura.message}`;
  }

  revalidatePath(`/admin/facturas/${facturaId}`);
  revalidatePath("/admin/pagos");
  return "ok";
}

/**
 * Recorre facturas pendientes/parciales vencidas y les aplica el recargo por
 * mora una sola vez (usa la tarifa vigente a la fecha de vencimiento de cada
 * una, la misma que se usó al generarla). Idempotente: una factura que ya
 * quedó en estado "vencida" no vuelve a recargarse en una corrida posterior.
 */
export async function revisarVencimientos() {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: facturas } = await supabase
    .from("factura")
    .select("id, vencimiento, monto_total, monto_pagado, detalle_calculo")
    .in("estado", ["pendiente", "parcial"])
    .lt("vencimiento", hoy);

  for (const f of facturas ?? []) {
    const { data: tarifa } = await supabase
      .from("tarifa")
      .select("recargo_mora_pct")
      .lte("vigente_desde", f.vencimiento)
      .order("vigente_desde", { ascending: false })
      .limit(1)
      .maybeSingle();

    const saldo = Number(f.monto_total) - Number(f.monto_pagado);
    const recargo = calcularRecargoMora(saldo, tarifa?.recargo_mora_pct ?? 0);

    await supabase
      .from("factura")
      .update({
        estado: "vencida",
        monto_total: Number(f.monto_total) + recargo,
        detalle_calculo: {
          ...(f.detalle_calculo as object),
          recargo_mora: recargo,
        },
      })
      .eq("id", f.id);
  }

  revalidatePath("/admin/pagos");
}
