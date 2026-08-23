"use client";

import { useActionState, useEffect, useRef } from "react";
import { inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Action = (state: string | null, formData: FormData) => Promise<string>;

const SUGERENCIAS = ["Pileta", "Jardín", "Cochera", "Quincho"];

export function ExtraForm({ action }: { action: Action }) {
  const [result, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "ok") formRef.current?.reset();
  }, [result]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <input
        name="tipo"
        list="extras-sugeridos"
        required
        placeholder="ej. Pileta"
        className={inputClass}
      />
      <datalist id="extras-sugeridos">
        {SUGERENCIAS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
        {isPending ? "Agregando..." : "+ Agregar"}
      </Button>
      {result && result !== "ok" && <p className="text-sm text-danger">{result}</p>}
    </form>
  );
}
