"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearReglaMora(_prevState: string | null, formData: FormData) {
  const dias_desde = Number(formData.get("dias_desde"));
  const recargo_pct = Number(formData.get("recargo_pct"));

  if (!Number.isInteger(dias_desde) || dias_desde < 0) {
    return "Los días deben ser un número entero mayor o igual a 0.";
  }
  if (!(recargo_pct >= 0)) {
    return "El recargo debe ser mayor o igual a 0.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("regla_mora").insert({ dias_desde, recargo_pct });

  if (error) {
    return error.code === "23505"
      ? "Ya hay un tramo configurado con esa cantidad de días."
      : `No se pudo guardar: ${error.message}`;
  }

  revalidatePath("/admin/configuracion");
  return "ok";
}

export async function eliminarReglaMora(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("regla_mora").delete().eq("id", id);

  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);

  revalidatePath("/admin/configuracion");
}
