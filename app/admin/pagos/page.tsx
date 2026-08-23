import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revisarVencimientos } from "@/lib/actions/pagos";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass } from "@/components/ui/table";

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ propietario?: string }>;
}) {
  const { propietario } = await searchParams;
  const supabase = await createClient();
  const { data: facturas } = await supabase
    .from("factura")
    .select(
      "id, mes, anio, estado, monto_total, monto_pagado, vencimiento, lote:lote_id(numero, propietario_id, perfil:propietario_id(nombre, telefono))",
    )
    .in("estado", ["pendiente", "parcial", "vencida"])
    .order("vencimiento");

  type FacturaLote = { numero: string; propietario_id: string | null; perfil: { nombre: string; telefono: string | null } | null };
  const todas = (facturas ?? []).map((f) => ({ ...f, lote: f.lote as unknown as FacturaLote | null }));

  const filtradas = propietario ? todas.filter((f) => f.lote?.propietario_id === propietario) : todas;
  const nombreFiltro = propietario ? filtradas[0]?.lote?.perfil?.nombre : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cobranzas"
        subtitle={
          propietario ? (
            <>
              Viendo deuda de: <span className="font-medium text-foreground">{nombreFiltro ?? "propietario"}</span>{" "}
              · <Link href="/admin/pagos" className="text-primary hover:underline">Ver todas</Link>
            </>
          ) : (
            "Facturas pendientes, parciales o vencidas de todos los períodos."
          )
        }
        actions={
          <form action={revisarVencimientos}>
            <ConfirmSubmitButton
              label="Revisar vencimientos"
              confirmText="Aplica el recargo por mora a las facturas vencidas que todavía no lo tienen. No afecta las que ya están al día."
              variant="secondary"
            />
          </form>
        }
      />

      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success-soft p-10 text-center">
          <span className="text-3xl">✓</span>
          <div>
            <p className="font-semibold text-success">
              {propietario ? "Este propietario está al día" : "No hay facturas pendientes de cobro"}
            </p>
            <p className="mt-1 text-sm text-success/70">
              Todas las facturas {propietario ? "de este propietario " : ""}están pagadas.
            </p>
          </div>
        </div>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full max-w-4xl text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Lote</th>
                <th className={thClass}>Propietario</th>
                <th className={thClass}>Teléfono</th>
                <th className={thClass}>Período</th>
                <th className={thClass}>Vencimiento</th>
                <th className={thClass}>Saldo</th>
                <th className={thClass}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((f) => {
                const saldo = Number(f.monto_total) - Number(f.monto_pagado);
                return (
                  <tr key={f.id} className={trClass}>
                    <td className={tdClass}>
                      <Link href={`/admin/facturas/${f.id}`} className="font-medium text-primary hover:underline">
                        {f.lote?.numero}
                      </Link>
                    </td>
                    <td className={tdClass}>{f.lote?.perfil?.nombre ?? "—"}</td>
                    <td className={tdClass}>{f.lote?.perfil?.telefono ?? "—"}</td>
                    <td className={tdClass}>{f.mes}/{f.anio}</td>
                    <td className={tdClass}>{f.vencimiento}</td>
                    <td className={tdClass}>${saldo.toFixed(2)}</td>
                    <td className={tdClass}>
                      <EstadoBadge estado={f.estado} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
