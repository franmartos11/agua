"use client";

import { buttonVariants } from "@/components/ui/button";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonVariants({ variant: "secondary", className: "print:hidden" })}
    >
      Descargar / imprimir PDF
    </button>
  );
}
