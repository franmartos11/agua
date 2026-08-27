"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearReglaMora } from "@/lib/actions/mora";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function MoraForm() {
  const [result, formAction, isPending] = useActionState(crearReglaMora, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "ok") formRef.current?.reset();
  }, [result]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <Field label="Desde cuántos días de atraso" htmlFor="dias_desde">
        <input
          id="dias_desde"
          name="dias_desde"
          type="number"
          step="1"
          min="0"
          required
          placeholder="ej. 30"
          className={`w-32 ${inputClass}`}
        />
      </Field>
      <Field label="Recargo (%)" htmlFor="recargo_pct">
        <input
          id="recargo_pct"
          name="recargo_pct"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="ej. 10"
          className={`w-28 ${inputClass}`}
        />
      </Field>
      <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
        {isPending ? "Agregando..." : "+ Agregar recargo"}
      </Button>
      {result && result !== "ok" && (
        <p className="w-full rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
      )}
    </form>
  );
}
