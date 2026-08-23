import { PageHeader } from "@/components/ui/page-header";
import { ImportForm } from "./import-form";

export default function LecturasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Importar lecturas"
        subtitle={
          <>
            Subí un CSV con columnas <code className="rounded bg-muted px-1 py-0.5">numero_serie</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">valor</code> y opcionalmente{" "}
            <code className="rounded bg-muted px-1 py-0.5">fecha</code> (AAAA-MM-DD). Una fila por medidor. Para
            cargar una lectura suelta, andá al detalle del medidor desde el lote.
          </>
        }
      />
      <ImportForm />
    </div>
  );
}
