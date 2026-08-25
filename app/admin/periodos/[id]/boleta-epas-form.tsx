"use client";

import { useActionState, useState } from "react";
import { guardarBoletaEpas } from "@/lib/actions/periodos";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function BoletaEpasForm({
  periodoId,
  epasM3,
  epasMonto,
}: {
  periodoId: string;
  epasM3: number | null;
  epasMonto: number | null;
}) {
  const action = guardarBoletaEpas.bind(null, periodoId);
  const [state, formAction, isPending] = useActionState(action, null);
  const [m3, setM3] = useState(epasM3?.toString() ?? "");
  const [monto, setMonto] = useState(epasMonto?.toString() ?? "");

  const precioM3 = Number(m3) > 0 && Number(monto) > 0 ? Number(monto) / Number(m3) : null;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="m³ totales (macromedidor)" htmlFor="epas_m3">
          <input
            id="epas_m3"
            name="epas_m3"
            type="number"
            step="0.01"
            min="0"
            value={m3}
            onChange={(e) => setM3(e.target.value)}
            placeholder="3000"
            className={`w-40 ${inputClass}`}
          />
        </Field>
        <Field label="Monto total de la boleta" htmlFor="epas_monto">
          <input
            id="epas_monto"
            name="epas_monto"
            type="number"
            step="0.01"
            min="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="3000000"
            className={`w-40 ${inputClass}`}
          />
        </Field>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      {precioM3 !== null && (
        <p className="text-sm text-foreground">
          Precio por m³: <span className="font-semibold text-primary">${precioM3.toFixed(2)}</span>
          <span className="text-muted-foreground"> — así se cobra el consumo de cada lote.</span>
        </p>
      )}
      {precioM3 === null && (
        <p className="text-xs text-muted-foreground">
          Sin boleta cargada: el consumo se cobra por los tramos de la tarifa vigente.
        </p>
      )}

      {state && state !== "ok" && <p className="text-sm text-danger">{state}</p>}
    </form>
  );
}
