"use client";

import { useActionState } from "react";
import { importarLecturas, type ImportResult } from "@/lib/actions/lecturas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: ImportResult = null;

export function ImportForm() {
  const [result, formAction, isPending] = useActionState(importarLecturas, initialState);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="archivo" className="text-xs font-medium text-muted-foreground">
              Archivo CSV
            </label>
            <input id="archivo" name="archivo" type="file" accept=".csv,text/csv" required className="text-sm" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Importando..." : "Importar"}
          </Button>
        </form>
      </Card>

      {result && (
        <Card>
          <p className="font-medium text-foreground">{result.insertados} lecturas importadas.</p>
          {result.advertencias.length > 0 && (
            <div className="mt-3 rounded-lg bg-warning-soft p-3">
              <p className="text-sm font-medium text-warning">Advertencias (se importaron igual, revisar):</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-warning">
                {result.advertencias.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {result.errores.length > 0 && (
            <div className="mt-3 rounded-lg bg-danger-soft p-3">
              <p className="text-sm font-medium text-danger">Filas no importadas:</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-danger">
                {result.errores.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
