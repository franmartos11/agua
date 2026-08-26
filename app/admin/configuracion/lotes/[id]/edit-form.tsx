"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Action = (state: string | null, formData: FormData) => Promise<string>;
type Propietario = { id: string; nombre: string };

export function EditLoteForm({
  action,
  lote,
  propietarios,
}: {
  action: Action;
  lote: {
    numero: string;
    direccion: string | null;
    estado: string;
    superficie_m2: number | null;
    propietario_id: string | null;
  };
  propietarios: Propietario[];
}) {
  const [result, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field label="Número" htmlFor="numero">
        <input id="numero" name="numero" defaultValue={lote.numero} required className={`w-28 ${inputClass}`} />
      </Field>
      <Field label="Dirección" htmlFor="direccion" className="min-w-[10rem]">
        <input id="direccion" name="direccion" defaultValue={lote.direccion ?? ""} className={inputClass} />
      </Field>
      <Field label="Superficie (m²)" htmlFor="superficie_m2">
        <input
          id="superficie_m2"
          name="superficie_m2"
          type="number"
          step="0.01"
          defaultValue={lote.superficie_m2 ?? ""}
          className={`w-28 ${inputClass}`}
        />
      </Field>
      <Field label="Estado" htmlFor="estado">
        <select id="estado" name="estado" defaultValue={lote.estado} className={inputClass}>
          <option value="ocupado">Ocupado</option>
          <option value="vacio">Vacío</option>
          <option value="construccion">En construcción</option>
        </select>
      </Field>
      <Field label="Propietario" htmlFor="propietario_id" className="min-w-[10rem]">
        <select id="propietario_id" name="propietario_id" defaultValue={lote.propietario_id ?? ""} className={inputClass}>
          <option value="">Sin asignar</option>
          {propietarios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar"}
      </Button>
      {result && result !== "ok" && (
        <p className="w-full rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
      )}
    </form>
  );
}
