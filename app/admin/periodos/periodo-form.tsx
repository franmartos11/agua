"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearPeriodo } from "@/lib/actions/periodos";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const hoy = new Date();

export function PeriodoForm() {
  const [result, formAction, isPending] = useActionState(crearPeriodo, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "ok") formRef.current?.reset();
  }, [result]);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Nuevo período</h2>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <Field label="Mes" htmlFor="mes">
          <select id="mes" name="mes" defaultValue={String(hoy.getMonth() + 1)} className={inputClass}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Año" htmlFor="anio">
          <input id="anio" name="anio" type="number" defaultValue={hoy.getFullYear()} className={`w-24 ${inputClass}`} />
        </Field>
        <Field label="Vencimiento" htmlFor="fecha_vencimiento">
          <input id="fecha_vencimiento" name="fecha_vencimiento" type="date" required className={inputClass} />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear período"}
        </Button>
        {result && result !== "ok" && (
          <p className="w-full rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
        )}
      </form>
    </Card>
  );
}
