import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";
import { PeriodoForm } from "./periodo-form";

export default async function PeriodosPage() {
  const supabase = await createClient();
  const { data: periodos } = await supabase
    .from("periodo_facturacion")
    .select("id, mes, anio, fecha_vencimiento, estado")
    .order("anio", { ascending: false })
    .order("mes", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Períodos de facturación" />
      <PeriodoForm />

      <div className={tableWrapClass}>
        <table className="w-full max-w-lg text-left text-sm">
          <thead>
            <tr className={theadRowClass}>
              <th className={thClass}>Período</th>
              <th className={thClass}>Vencimiento</th>
              <th className={thClass}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {periodos?.map((p) => (
              <tr key={p.id} className={trClass}>
                <td className={tdClass}>
                  <Link href={`/admin/periodos/${p.id}`} className="font-medium text-primary hover:underline">
                    {p.mes}/{p.anio}
                  </Link>
                </td>
                <td className={tdClass}>{p.fecha_vencimiento}</td>
                <td className={tdClass}>
                  <EstadoBadge estado={p.estado} />
                </td>
              </tr>
            ))}
            {periodos?.length === 0 && (
              <tr>
                <td colSpan={3} className={emptyTdClass}>
                  Todavía no hay períodos creados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
