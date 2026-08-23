"use client";

import { useActionState, useEffect, useRef } from "react";
import { invitarPropietario } from "@/lib/actions/propietarios";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function InviteForm() {
  const [result, formAction, isPending] = useActionState(invitarPropietario, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "ok") formRef.current?.reset();
  }, [result]);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Invitar propietario</h2>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <Field label="Nombre" htmlFor="nombre" className="min-w-[10rem]">
          <input id="nombre" name="nombre" required className={inputClass} />
        </Field>
        <Field label="Email" htmlFor="email" className="min-w-[12rem]">
          <input id="email" name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Teléfono (opcional)" htmlFor="telefono" className="min-w-[9rem]">
          <input id="telefono" name="telefono" className={inputClass} />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Invitando..." : "Invitar"}
        </Button>
        {result && result !== "ok" && (
          <p className="w-full rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
        )}
        {result === "ok" && (
          <p className="w-full rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
            Invitación enviada.
          </p>
        )}
      </form>
    </Card>
  );
}
