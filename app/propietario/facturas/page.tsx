import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";

export default async function MisFacturasPage() {
  const supabase = await createClient();
  const { data: facturas } = await supabase
    .from("factura")
    .select("id, mes, anio, estado, monto_total, monto_pagado, vencimiento, lote:lote_id(numero)")
    .order("anio", { ascending: false })
    .order("mes", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mis facturas" />
      <div className={tableWrapClass}>
        <table className="w-full max-w-2xl text-left text-sm">
          <thead>
            <tr className={theadRowClass}>
              <th className={thClass}>Lote</th>
              <th className={thClass}>Período</th>
              <th className={thClass}>Vencimiento</th>
              <th className={thClass}>Saldo</th>
              <th className={thClass}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {facturas?.map((f) => {
              const lote = f.lote as unknown as { numero: string } | null;
              const saldo = Number(f.monto_total) - Number(f.monto_pagado);
              return (
                <tr key={f.id} className={trClass}>
                  <td className={tdClass}>
                    <Link href={`/propietario/facturas/${f.id}`} className="font-medium text-primary hover:underline">
                      {lote?.numero}
                    </Link>
                  </td>
                  <td className={tdClass}>{f.mes}/{f.anio}</td>
                  <td className={tdClass}>{f.vencimiento}</td>
                  <td className={tdClass}>${saldo.toFixed(2)}</td>
                  <td className={tdClass}>
                    <EstadoBadge estado={f.estado} />
                  </td>
                </tr>
              );
            })}
            {facturas?.length === 0 && (
              <tr>
                <td colSpan={5} className={emptyTdClass}>
                  Todavía no hay facturas emitidas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
