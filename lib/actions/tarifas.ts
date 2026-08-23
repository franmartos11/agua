"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type TramoInput = { desde_m3: number; hasta_m3: number | null; precio_m3: number };
type ExtraInput = { tipo: string; monto: number };

export async function crearTarifa(_prevState: string | null, formData: FormData) {
  const vigente_desde = formData.get("vigente_desde") as string;
  const cargo_fijo = Number(formData.get("cargo_fijo"));
  const cargoFijoVacioRaw = formData.get("cargo_fijo_vacio") as string;
  const cargo_fijo_vacio = cargoFijoVacioRaw ? Number(cargoFijoVacioRaw) : null;
  const recargo_mora_pct = Number(formData.get("recargo_mora_pct") || 0);

  let tramos: TramoInput[];
  let extras: ExtraInput[];
  try {
    tramos = JSON.parse(formData.get("tramos_json") as string);
    extras = JSON.parse(formData.get("extras_json") as string);
  } catch {
    return "Error interno armando tramos/extras.";
  }

  if (tramos.length === 0) {
    return "Agregá al menos un tramo de consumo.";
  }

  const supabase = await createClient();

  const { data: tarifa, error } = await supabase
    .from("tarifa")
    .insert({ vigente_desde, cargo_fijo, cargo_fijo_vacio, recargo_mora_pct })
    .select("id")
    .single();

  if (error || !tarifa) {
    return `No se pudo crear la tarifa: ${error?.message}`;
  }

  const { error: errorTramos } = await supabase.from("tarifa_tramo").insert(
    tramos.map((t, i) => ({
      tarifa_id: tarifa.id,
      orden: i + 1,
      desde_m3: t.desde_m3,
      hasta_m3: t.hasta_m3,
      precio_m3: t.precio_m3,
    })),
  );

  if (errorTramos) {
    return `Tarifa creada pero fallaron los tramos: ${errorTramos.message}`;
  }

  if (extras.length > 0) {
    const { error: errorExtras } = await supabase.from("tarifa_extra").insert(
      extras.map((e) => ({
        tarifa_id: tarifa.id,
        tipo: e.tipo.toLowerCase(),
        monto: e.monto,
      })),
    );
    if (errorExtras) {
      return `Tarifa creada pero fallaron los extras: ${errorExtras.message}`;
    }
  }

  revalidatePath("/admin/tarifas");
  return "ok";
}
