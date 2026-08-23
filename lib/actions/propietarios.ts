"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function invitarPropietario(
  _prevState: string | null,
  formData: FormData,
) {
  const email = formData.get("email") as string;
  const nombre = formData.get("nombre") as string;
  const telefono = formData.get("telefono") as string;

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { rol: "owner", nombre },
    redirectTo: `${siteUrl}/actualizar-password`,
  });

  if (error) {
    return `No se pudo invitar: ${error.message}`;
  }

  if (telefono) {
    await admin.from("perfil").update({ telefono }).eq("id", data.user.id);
  }

  revalidatePath("/admin/propietarios");
  return "ok";
}

export async function actualizarPropietario(
  id: string,
  _prevState: string | null,
  formData: FormData,
) {
  const nombre = formData.get("nombre") as string;
  const telefono = formData.get("telefono") as string;

  const supabase = await createClient();
  const { error } = await supabase
    .from("perfil")
    .update({ nombre, telefono: telefono || null })
    .eq("id", id);

  if (error) {
    return `No se pudo guardar: ${error.message}`;
  }

  revalidatePath("/admin/propietarios");
  revalidatePath(`/admin/propietarios/${id}`);
  return "ok";
}

export async function eliminarPropietario(id: string) {
  const admin = createAdminClient();
  // Cascade: al borrar el usuario de auth, la fila de perfil se borra sola
  // (FK on delete cascade). Los lotes que apuntaban a este propietario quedan
  // con propietario_id null porque no hay on delete cascade en esa relación.
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    throw new Error(`No se pudo eliminar: ${error.message}`);
  }

  revalidatePath("/admin/propietarios");
  revalidatePath("/admin/lotes");
}
