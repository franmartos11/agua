"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Action = (state: string | null, formData: FormData) => Promise<string>;

export function PagoForm({ action }: { action: Action }) {
  const [result, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "ok") formRef.current?.reset();
  }, [result]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <Field label="Monto" htmlFor="monto">
        <input id="monto" name="monto" type="number" step="0.01" min="0.01" required className={`w-32 ${inputClass}`} />
      </Field>
      <Field label="Fecha" htmlFor="fecha">
        <input id="fecha" name="fecha" type="date" className={inputClass} />
      </Field>
      <Field label="Método" htmlFor="metodo">
        <select id="metodo" name="metodo" defaultValue="transferencia" className={inputClass}>
          <option value="transferencia">Transferencia</option>
          <option value="efectivo">Efectivo</option>
          <option value="mercado_pago">Mercado Pago</option>
        </select>
      </Field>
      <Field label="Comprobante (opcional)" htmlFor="comprobante">
        <input id="comprobante" name="comprobante" type="file" className="text-sm" />
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Registrar pago"}
      </Button>
      {result && result !== "ok" && (
        <p className="w-full rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
      )}
    </form>
  );
}
