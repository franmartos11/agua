"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setPassword } from "@/lib/actions/password";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function SetPasswordForm() {
  const [result, formAction, isPending] = useActionState(setPassword, null);
  const router = useRouter();

  useEffect(() => {
    if (result === "ok") router.push("/login");
  }, [result, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nueva contraseña" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>
      {result && result !== "ok" && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result}</p>
      )}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
