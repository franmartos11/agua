"use client";

import { useActionState, useEffect, useRef } from "react";
import { subirPlanoInformativo, type TipoPlanoInformativo } from "@/lib/actions/planos";
import { Button } from "@/components/ui/button";

export function InformativoForm({ tipo }: { tipo: TipoPlanoInformativo }) {
  const action = subirPlanoInformativo.bind(null, tipo);
  const [result, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "ok") formRef.current?.reset();
  }, [result]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <input
        name="archivo"
        type="file"
        accept="image/*,.pdf"
        required
        className="text-sm text-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Subiendo..." : "Subir / reemplazar"}
      </Button>
      {result && result !== "ok" && <p className="w-full text-sm text-danger">{result}</p>}
    </form>
  );
}
