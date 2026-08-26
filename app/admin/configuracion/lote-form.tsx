"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearLote } from "@/lib/actions/lotes";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Propietario = { id: string; nombre: string };

export function LoteForm({ propietarios }: { propietarios: Propietario[] }) {
  const [result, formAction, isPending] = useActionState(crearLote, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "ok") formRef.current?.reset();
  }, [result]);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Nuevo lote</h2>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <Field label="Número de lote" htmlFor="numero">
          <input id="numero" name="numero" required className={`w-28 ${inputClass}`} />
        </Field>
        <Field label="Dirección" htmlFor="direccion" className="min-w-[10rem]">
          <input id="direccion" name="direccion" className={inputClass} />
        </Field>
        <Field label="Superficie (m²)" htmlFor="superficie_m2">
          <input
            id="superficie_m2"
            name="superficie_m2"
            type="number"
            step="0.01"
            className={`w-28 ${inputClass}`}
          />
        </Field>
        <Field label="Estado" htmlFor="estado">
          <select id="estado" name="estado" defaultValue="ocupado" className={inputClass}>
            <option value="ocupado">Ocupado</option>
            <option value="vacio">Vacío</option>
            <option value="construccion">En construcción</option>
          </select>
        </Field>
        <Field label="Propietario" htmlFor="propietario_id" className="min-w-[10rem]">
          <select id="propietario_id" name="propietario_id" defaultValue="" className={inputClass}>
            <option value="">Sin asignar</option>
            {propietarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear lote"}
        </Button>
        {result && result !== "ok" && (
          <p className="w-full rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
        )}
      </form>
    </Card>
  );
}
