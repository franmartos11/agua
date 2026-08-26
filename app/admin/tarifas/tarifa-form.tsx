"use client";

import { useActionState, useState } from "react";
import { crearTarifa } from "@/lib/actions/tarifas";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Tramo = { desde_m3: string; hasta_m3: string; precio_m3: string };
type Extra = { tipo: string; monto: string };

const hoy = new Date().toISOString().slice(0, 10);
const rowInput = `${inputClass} py-1.5`;

export function TarifaForm() {
  const [result, formAction, isPending] = useActionState(crearTarifa, null);
  const [tramos, setTramos] = useState<Tramo[]>([{ desde_m3: "0", hasta_m3: "", precio_m3: "" }]);
  const [extras, setExtras] = useState<Extra[]>([{ tipo: "Pileta", monto: "" }]);

  const tramosJson = JSON.stringify(
    tramos
      .filter((t) => t.precio_m3 !== "")
      .map((t) => ({
        desde_m3: Number(t.desde_m3) || 0,
        hasta_m3: t.hasta_m3 === "" ? null : Number(t.hasta_m3),
        precio_m3: Number(t.precio_m3),
      })),
  );
  const extrasJson = JSON.stringify(
    extras.filter((e) => e.tipo && e.monto !== "").map((e) => ({ tipo: e.tipo, monto: Number(e.monto) })),
  );

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-foreground">Nueva tarifa</h2>
      <form action={formAction} className="flex flex-col gap-6">
        <input type="hidden" name="tramos_json" value={tramosJson} />
        <input type="hidden" name="extras_json" value={extrasJson} />

        <div className="flex flex-wrap gap-3">
          <Field label="Vigente desde" htmlFor="vigente_desde">
            <input id="vigente_desde" name="vigente_desde" type="date" defaultValue={hoy} required className={inputClass} />
          </Field>
          <Field label="Cargo fijo (lote ocupado)" htmlFor="cargo_fijo">
            <input
              id="cargo_fijo"
              name="cargo_fijo"
              type="number"
              step="0.01"
              min="0"
              required
              className={`w-32 ${inputClass}`}
            />
          </Field>
          <Field label="Cargo fijo (vacío/construcción)" htmlFor="cargo_fijo_vacio">
            <input
              id="cargo_fijo_vacio"
              name="cargo_fijo_vacio"
              type="number"
              step="0.01"
              min="0"
              placeholder="vacío = no cobra"
              className={`w-40 ${inputClass}`}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Tramos de consumo (progresivos)</p>
          <div className="flex flex-col gap-2">
            {tramos.map((t, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="w-14 text-xs text-muted-foreground">Tramo {i + 1}</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="desde m³"
                  value={t.desde_m3}
                  onChange={(e) => {
                    const copia = [...tramos];
                    copia[i] = { ...copia[i], desde_m3: e.target.value };
                    setTramos(copia);
                  }}
                  className={`w-24 ${rowInput}`}
                />
                <span className="text-sm text-muted-foreground">a</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="hasta m³ (vacío = sin tope)"
                  value={t.hasta_m3}
                  onChange={(e) => {
                    const copia = [...tramos];
                    copia[i] = { ...copia[i], hasta_m3: e.target.value };
                    setTramos(copia);
                  }}
                  className={`w-44 ${rowInput}`}
                />
                <span className="text-sm text-muted-foreground">$/m³</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="precio"
                  value={t.precio_m3}
                  onChange={(e) => {
                    const copia = [...tramos];
                    copia[i] = { ...copia[i], precio_m3: e.target.value };
                    setTramos(copia);
                  }}
                  className={`w-24 ${rowInput}`}
                />
                {tramos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTramos(tramos.filter((_, idx) => idx !== i))}
                    className="text-sm text-danger hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setTramos([
                  ...tramos,
                  { desde_m3: tramos[tramos.length - 1]?.hasta_m3 || "", hasta_m3: "", precio_m3: "" },
                ])
              }
              className="w-fit text-sm font-medium text-primary hover:underline"
            >
              + Agregar tramo
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Cargo por extra (pileta, jardín, etc.)</p>
          <div className="flex flex-col gap-2">
            {extras.map((e, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  placeholder="tipo (ej. Pileta)"
                  value={e.tipo}
                  onChange={(ev) => {
                    const copia = [...extras];
                    copia[i] = { ...copia[i], tipo: ev.target.value };
                    setExtras(copia);
                  }}
                  className={`w-40 ${rowInput}`}
                />
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="monto"
                  value={e.monto}
                  onChange={(ev) => {
                    const copia = [...extras];
                    copia[i] = { ...copia[i], monto: ev.target.value };
                    setExtras(copia);
                  }}
                  className={`w-28 ${rowInput}`}
                />
                <button
                  type="button"
                  onClick={() => setExtras(extras.filter((_, idx) => idx !== i))}
                  className="text-sm text-danger hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExtras([...extras, { tipo: "", monto: "" }])}
              className="w-fit text-sm font-medium text-primary hover:underline"
            >
              + Agregar extra
            </button>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? "Guardando..." : "Crear tarifa"}
        </Button>
        {result && result !== "ok" && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
        )}
        {result === "ok" && (
          <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">Tarifa creada.</p>
        )}
      </form>
    </Card>
  );
}
