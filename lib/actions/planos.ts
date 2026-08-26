"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TipoPlanoInformativo = "cloacas" | "red_agua";

/** Sube (y reemplaza) el archivo informativo de cloacas o red de agua. */
export async function subirPlanoInformativo(
  tipo: TipoPlanoInformativo,
  _prevState: string | null,
  formData: FormData,
) {
  const archivo = formData.get("archivo") as File | null;
  if (!archivo || archivo.size === 0) return "Elegí un archivo.";

  const supabase = await createClient();

  const { data: actual } = await supabase
    .from("plano_informativo")
    .select("storage_path")
    .eq("tipo", tipo)
    .maybeSingle();

  const ext = archivo.name.split(".").pop();
  const path = `${tipo}/${Date.now()}.${ext}`;

  const { error: errorUpload } = await supabase.storage.from("planos-informativos").upload(path, archivo);
  if (errorUpload) return `No se pudo subir el archivo: ${errorUpload.message}`;

  const { error: errorDb } = await supabase.from("plano_informativo").upsert({
    tipo,
    storage_path: path,
    nombre_archivo: archivo.name,
    updated_at: new Date().toISOString(),
  });
  if (errorDb) return `No se pudo guardar: ${errorDb.message}`;

  if (actual?.storage_path) {
    await supabase.storage.from("planos-informativos").remove([actual.storage_path]);
  }

  revalidatePath("/admin/plano");
  return "ok";
}
