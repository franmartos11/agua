"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Action = (state: string | null, formData: FormData) => Promise<string>;

export function LecturaForm({ action }: { action: Action }) {
  const [result, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "ok") formRef.current?.reset();
  }, [result]);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Cargar lectura</h2>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <Field label="Lectura (m³)" htmlFor="valor">
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            className={`w-32 ${inputClass}`}
          />
        </Field>
        <Field label="Fecha" htmlFor="fecha">
          <input id="fecha" name="fecha" type="date" className={inputClass} />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Cargando..." : "Cargar lectura"}
        </Button>
        {result && result !== "ok" && (
          <p className="w-full rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
        )}
      </form>
    </Card>
  );
}
