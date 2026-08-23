"use server";

import { createClient } from "@/lib/supabase/server";

export async function setPassword(_prevState: string | null, formData: FormData) {
  const password = formData.get("password") as string;

  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return "No se pudo actualizar la contraseña. Volvé a pedir el link de invitación.";
  }

  return "ok";
}
