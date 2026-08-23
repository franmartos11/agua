"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Action = (state: string | null, formData: FormData) => Promise<string>;

export function MedidorForm({ action }: { action: Action }) {
  const [result, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "ok") formRef.current?.reset();
  }, [result]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <Field label="N° de serie" htmlFor="numero_serie">
        <input id="numero_serie" name="numero_serie" required className={inputClass} />
      </Field>
      <Field label="Tipo" htmlFor="tipo">
        <select id="tipo" name="tipo" defaultValue="principal" className={inputClass}>
          <option value="principal">Principal</option>
          <option value="riego">Riego</option>
        </select>
      </Field>
      <Field label="Fecha instalación" htmlFor="fecha_instalacion">
        <input id="fecha_instalacion" name="fecha_instalacion" type="date" className={inputClass} />
      </Field>
      <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
        {isPending ? "Agregando..." : "+ Agregar medidor"}
      </Button>
      {result && result !== "ok" && <p className="text-sm text-danger">{result}</p>}
    </form>
  );
}
