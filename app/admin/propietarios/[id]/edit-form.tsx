"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Action = (state: string | null, formData: FormData) => Promise<string>;

export function EditPropietarioForm({
  action,
  nombre,
  telefono,
}: {
  action: Action;
  nombre: string;
  telefono: string | null;
}) {
  const [result, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-3">
      <Field label="Nombre" htmlFor="nombre">
        <input id="nombre" name="nombre" defaultValue={nombre} required className={inputClass} />
      </Field>
      <Field label="Teléfono" htmlFor="telefono">
        <input id="telefono" name="telefono" defaultValue={telefono ?? ""} className={inputClass} />
      </Field>
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Guardando..." : "Guardar"}
      </Button>
      {result && result !== "ok" && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
      )}
    </form>
  );
}
