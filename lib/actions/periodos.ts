"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcularFactura } from "@/lib/facturacion";

export async function crearPeriodo(_prevState: string | null, formData: FormData) {
  const mes = Number(formData.get("mes"));
  const anio = Number(formData.get("anio"));
  const fecha_vencimiento = formData.get("fecha_vencimiento") as string;

  const supabase = await createClient();
  const { error } = await supabase
    .from("periodo_facturacion")
    .insert({ mes, anio, fecha_vencimiento });

  if (error) {
    return `No se pudo crear el período: ${error.message}`;
  }

  revalidatePath("/admin/periodos");
  return "ok";
}

/**
 * Genera (o regenera, si el período sigue abierto) una factura por lote.
 * Consumo = última lectura <= vencimiento del período, menos la lectura
 * inmediatamente anterior a esa, sumado entre todos los medidores activos del lote.
 * La tarifa vigente es la de mayor vigente_desde <= vencimiento del período.
 */
export async function generarFacturas(periodoId: string) {
  const supabase = await createClient();

  const { data: periodo } = await supabase
    .from("periodo_facturacion")
    .select("id, mes, anio, fecha_vencimiento, estado, epas_m3, epas_monto")
    .eq("id", periodoId)
    .single();

  if (!periodo) throw new Error("Período no encontrado.");
  if (periodo.estado === "cerrado") {
    throw new Error("El período está cerrado, no se puede regenerar.");
  }

  const { data: tarifa } = await supabase
    .from("tarifa")
    .select("id, cargo_fijo, cargo_fijo_vacio")
    .lte("vigente_desde", periodo.fecha_vencimiento)
    .order("vigente_desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tarifa) throw new Error("No hay ninguna tarifa vigente para la fecha de este período.");

  const [{ data: tramos }, { data: extrasTarifa }, { data: lotes }, { data: extrasLotes }, { data: medidores }] =
    await Promise.all([
      supabase.from("tarifa_tramo").select("orden, desde_m3, hasta_m3, precio_m3").eq("tarifa_id", tarifa.id),
      supabase.from("tarifa_extra").select("tipo, monto").eq("tarifa_id", tarifa.id),
      supabase.from("lote").select("id, estado"),
      supabase.from("extra").select("lote_id, tipo").is("vigente_hasta", null),
      supabase.from("medidor").select("id, lote_id").eq("activo", true),
    ]);

  const medidorIds = medidores?.map((m) => m.id) ?? [];
  const { data: lecturas } = await supabase
    .from("lectura")
    .select("medidor_id, valor, fecha")
    .in("medidor_id", medidorIds)
    .lte("fecha", periodo.fecha_vencimiento)
    .order("fecha", { ascending: false });

  const lecturasPorMedidor = new Map<string, { valor: number; fecha: string }[]>();
  for (const l of lecturas ?? []) {
    const lista = lecturasPorMedidor.get(l.medidor_id) ?? [];
    lista.push({ valor: l.valor, fecha: l.fecha });
    lecturasPorMedidor.set(l.medidor_id, lista);
  }

  const medidoresPorLote = new Map<string, string[]>();
  for (const m of medidores ?? []) {
    const lista = medidoresPorLote.get(m.lote_id) ?? [];
    lista.push(m.id);
    medidoresPorLote.set(m.lote_id, lista);
  }

  const extrasPorLote = new Map<string, string[]>();
  for (const e of extrasLotes ?? []) {
    const lista = extrasPorLote.get(e.lote_id) ?? [];
    lista.push(e.tipo);
    extrasPorLote.set(e.lote_id, lista);
  }

  const filas = (lotes ?? []).map((lote) => {
    const medidorIdsLote = medidoresPorLote.get(lote.id) ?? [];
    let consumoM3 = 0;
    let sinBase = false;

    for (const medidorId of medidorIdsLote) {
      const historial = lecturasPorMedidor.get(medidorId) ?? [];
      const [actual, anterior] = historial;
      if (actual && anterior) {
        consumoM3 += Math.max(0, actual.valor - anterior.valor);
      } else {
        sinBase = true;
      }
    }

    const detalle = calcularFactura({
      consumoM3,
      estadoLote: lote.estado,
      extrasVigentes: extrasPorLote.get(lote.id) ?? [],
      tarifa,
      tramos: tramos ?? [],
      extrasTarifa: extrasTarifa ?? [],
      epas: periodo.epas_m3 && periodo.epas_monto ? { m3: Number(periodo.epas_m3), monto: Number(periodo.epas_monto) } : null,
    });

    return {
      lote_id: lote.id,
      periodo_id: periodo.id,
      mes: periodo.mes,
      anio: periodo.anio,
      consumo_m3: consumoM3,
      detalle_calculo: { ...detalle, sin_lectura_base: sinBase },
      monto_total: detalle.monto_total,
      vencimiento: periodo.fecha_vencimiento,
      estado: "pendiente" as const,
    };
  });

  await supabase.from("factura").delete().eq("periodo_id", periodo.id);
  const { error } = await supabase.from("factura").insert(filas);

  if (error) throw new Error(`No se pudieron generar las facturas: ${error.message}`);

  revalidatePath(`/admin/periodos/${periodoId}`);
  revalidatePath("/admin/periodos");
}

/**
 * Carga (o borra, si se dejan los campos vacíos) la boleta de EPAS del
 * macromedidor para este período: sus m³ y el monto pagado. Se usa para
 * repartir el consumo entre lotes a precio único en vez de por tramos.
 */
export async function guardarBoletaEpas(
  periodoId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const m3Raw = formData.get("epas_m3") as string;
  const montoRaw = formData.get("epas_monto") as string;

  const epas_m3 = m3Raw ? Number(m3Raw) : null;
  const epas_monto = montoRaw ? Number(montoRaw) : null;

  if ((epas_m3 && !epas_monto) || (!epas_m3 && epas_monto)) {
    return "Cargá los dos valores (m³ y monto), o dejá los dos vacíos para volver a los tramos.";
  }
  if (epas_m3 !== null && epas_m3 <= 0) return "Los m³ deben ser mayores a cero.";
  if (epas_monto !== null && epas_monto <= 0) return "El monto debe ser mayor a cero.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("periodo_facturacion")
    .update({ epas_m3, epas_monto })
    .eq("id", periodoId);

  if (error) return `No se pudo guardar: ${error.message}`;

  revalidatePath(`/admin/periodos/${periodoId}`);
  return "ok";
}

export async function cerrarPeriodo(periodoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("periodo_facturacion")
    .update({ estado: "cerrado" })
    .eq("id", periodoId);

  if (error) throw new Error(`No se pudo cerrar: ${error.message}`);

  revalidatePath(`/admin/periodos/${periodoId}`);
  revalidatePath("/admin/periodos");
}
