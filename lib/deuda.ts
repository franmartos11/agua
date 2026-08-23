import type { SupabaseClient } from "@supabase/supabase-js";

export type DeudaPropietario = {
  propietarioId: string | null;
  nombre: string;
  telefono: string | null;
  loteIds: string[];
  lotesNumeros: string[];
  facturasImpagas: number;
  saldo: number;
};

/**
 * Agrupa toda la deuda viva (facturas con estado != 'pagada') por propietario,
 * ordenada de mayor a menor saldo. Los lotes sin propietario asignado quedan
 * en un grupo aparte para no perder esa deuda de vista.
 */
export async function obtenerMorosidad(supabase: SupabaseClient): Promise<DeudaPropietario[]> {
  const { data: facturas } = await supabase
    .from("factura")
    .select("monto_total, monto_pagado, lote:lote_id(id, numero, propietario_id, perfil:propietario_id(nombre, telefono))")
    .neq("estado", "pagada");

  type Lote = {
    id: string;
    numero: string;
    propietario_id: string | null;
    perfil: { nombre: string; telefono: string | null } | null;
  };

  const grupos = new Map<
    string,
    Omit<DeudaPropietario, "loteIds" | "lotesNumeros"> & { loteIds: Set<string>; lotesNumeros: Set<string> }
  >();

  for (const f of facturas ?? []) {
    const lote = f.lote as unknown as Lote | null;
    const key = lote?.propietario_id ?? "sin-propietario";
    const actual = grupos.get(key) ?? {
      propietarioId: lote?.propietario_id ?? null,
      nombre: lote?.perfil?.nombre ?? "Sin propietario asignado",
      telefono: lote?.perfil?.telefono ?? null,
      loteIds: new Set<string>(),
      lotesNumeros: new Set<string>(),
      facturasImpagas: 0,
      saldo: 0,
    };
    if (lote) {
      actual.loteIds.add(lote.id);
      actual.lotesNumeros.add(lote.numero);
    }
    actual.facturasImpagas += 1;
    actual.saldo += Number(f.monto_total) - Number(f.monto_pagado);
    grupos.set(key, actual);
  }

  return [...grupos.values()]
    .map((g) => ({ ...g, loteIds: [...g.loteIds], lotesNumeros: [...g.lotesNumeros] }))
    .sort((a, b) => b.saldo - a.saldo);
}
