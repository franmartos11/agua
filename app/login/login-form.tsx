"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [error, formAction, isPending] = useActionState(signIn, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </Field>
      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
