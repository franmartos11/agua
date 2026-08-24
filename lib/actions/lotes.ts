"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearLote(_prevState: string | null, formData: FormData) {
  const numero = formData.get("numero") as string;
  const direccion = formData.get("direccion") as string;
  const estado = formData.get("estado") as string;
  const superficie = formData.get("superficie_m2") as string;
  const propietarioId = formData.get("propietario_id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("lote").insert({
    numero,
    direccion: direccion || null,
    estado,
    superficie_m2: superficie ? Number(superficie) : null,
    propietario_id: propietarioId || null,
  });

  if (error) {
    return `No se pudo crear el lote: ${error.message}`;
  }

  revalidatePath("/admin/lotes");
  return "ok";
}

export async function actualizarLote(
  id: string,
  _prevState: string | null,
  formData: FormData,
) {
  const numero = formData.get("numero") as string;
  const direccion = formData.get("direccion") as string;
  const estado = formData.get("estado") as string;
  const superficie = formData.get("superficie_m2") as string;
  const propietarioId = formData.get("propietario_id") as string;

  const supabase = await createClient();
  const { error } = await supabase
    .from("lote")
    .update({
      numero,
      direccion: direccion || null,
      estado,
      superficie_m2: superficie ? Number(superficie) : null,
      propietario_id: propietarioId || null,
    })
    .eq("id", id);

  if (error) {
    return `No se pudo guardar: ${error.message}`;
  }

  revalidatePath("/admin/lotes");
  revalidatePath(`/admin/lotes/${id}`);
  return "ok";
}

export async function eliminarLote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lote").delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar: ${error.message}`);
  }

  revalidatePath("/admin/lotes");
}

export async function agregarExtra(
  loteId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const tipo = formData.get("tipo") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("extra").insert({ lote_id: loteId, tipo });

  if (error) {
    return `No se pudo agregar: ${error.message}`;
  }

  revalidatePath(`/admin/lotes/${loteId}`);
  return "ok";
}

export async function quitarExtra(id: string, loteId: string) {
  const supabase = await createClient();
  // Baja lógica: preserva el histórico para no alterar facturas ya emitidas.
  const { error } = await supabase
    .from("extra")
    .update({ vigente_hasta: new Date().toISOString().slice(0, 10) })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo quitar: ${error.message}`);
  }

  revalidatePath(`/admin/lotes/${loteId}`);
}

export async function agregarMedidor(
  loteId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const numeroSerie = formData.get("numero_serie") as string;
  const tipo = formData.get("tipo") as string;
  const fechaInstalacion = formData.get("fecha_instalacion") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("medidor").insert({
    lote_id: loteId,
    numero_serie: numeroSerie,
    tipo,
    fecha_instalacion: fechaInstalacion || null,
  });

  if (error) {
    return `No se pudo agregar: ${error.message}`;
  }

  revalidatePath(`/admin/lotes/${loteId}`);
  return "ok";
}

export async function guardarPoligono(
  loteId: string,
  puntos: { x: number; y: number }[],
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lote")
    .update({ poligono: puntos })
    .eq("id", loteId);

  if (error) {
    throw new Error(`No se pudo guardar el polígono: ${error.message}`);
  }

  revalidatePath("/admin/plano");
}

export async function borrarPoligono(loteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lote")
    .update({ poligono: null })
    .eq("id", loteId);

  if (error) {
    throw new Error(`No se pudo borrar: ${error.message}`);
  }

  revalidatePath("/admin/plano");
}

export async function alternarMedidor(id: string, loteId: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("medidor")
    .update({ activo: !activo })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar: ${error.message}`);
  }

  revalidatePath(`/admin/lotes/${loteId}`);
}
