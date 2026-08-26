import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularRecargoMoraTramos } from "@/lib/facturacion";

/**
 * Recorre todas las facturas no pagadas y vencidas, y les recalcula el
 * recargo por mora según el tramo de días de atraso vigente hoy (configurado
 * en regla_mora). Pensada para correr sola todos los días — ver
 * app/api/cron/revisar-vencimientos — no requiere sesión de admin porque el
 * caller le pasa un cliente con la service role key.
 */
export async function recalcularMorosidad(supabase: SupabaseClient) {
  const hoy = new Date().toISOString().slice(0, 10);

  const [{ data: facturas }, { data: reglas }] = await Promise.all([
    supabase
      .from("factura")
      .select("id, vencimiento, monto_pagado, monto_total, estado, detalle_calculo")
      .neq("estado", "pagada")
      .lt("vencimiento", hoy),
    supabase.from("regla_mora").select("dias_desde, recargo_pct"),
  ]);

  let actualizadas = 0;

  for (const f of facturas ?? []) {
    const detalle = (f.detalle_calculo ?? {}) as Record<string, unknown>;
    const base = Number(detalle.monto_total ?? f.monto_total);
    const diasAtraso = Math.round(
      (new Date(hoy).getTime() - new Date(f.vencimiento).getTime()) / 86_400_000,
    );

    const { recargo, pct } = calcularRecargoMoraTramos(base, diasAtraso, reglas ?? []);
    const nuevoTotal = base + recargo;
    const saldo = nuevoTotal - Number(f.monto_pagado);
    const nuevoEstado = saldo <= 0 ? "pagada" : "vencida";

    if (nuevoTotal === Number(f.monto_total) && f.estado === nuevoEstado) continue;

    await supabase
      .from("factura")
      .update({
        monto_total: nuevoTotal,
        estado: nuevoEstado,
        detalle_calculo: {
          ...detalle,
          monto_total: base,
          recargo_mora: recargo,
          dias_atraso: diasAtraso,
          mora_pct_aplicado: pct,
        },
      })
      .eq("id", f.id);
    actualizadas++;
  }

  return actualizadas;
}
