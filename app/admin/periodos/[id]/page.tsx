import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generarFacturas, cerrarPeriodo } from "@/lib/actions/periodos";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";

export default async function PeriodoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: periodo } = await supabase
    .from("periodo_facturacion")
    .select("id, mes, anio, fecha_vencimiento, estado")
    .eq("id", id)
    .single();

  if (!periodo) notFound();

  const { data: facturas } = await supabase
    .from("factura")
    .select("id, consumo_m3, monto_total, estado, lote:lote_id(id, numero)")
    .eq("periodo_id", id)
    .order("id");

  const abierto = periodo.estado === "abierto";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Período ${periodo.mes}/${periodo.anio}`}
        subtitle={
          <>
            Vencimiento {periodo.fecha_vencimiento} · <EstadoBadge estado={periodo.estado} />
          </>
        }
        actions={
          abierto && (
            <>
              <form action={generarFacturas.bind(null, id)}>
                <ConfirmSubmitButton
                  label={facturas && facturas.length > 0 ? "Regenerar facturación" : "Generar facturación"}
                  confirmText="Esto calcula (o recalcula) la factura de cada lote para este período según las lecturas y la tarifa vigente. Si ya había facturas generadas, se reemplazan."
                  variant="primary"
                />
              </form>
              <form action={cerrarPeriodo.bind(null, id)}>
                <ConfirmSubmitButton
                  label="Cerrar período"
                  confirmText="Al cerrar el período ya no se va a poder regenerar la facturación. Los pagos se siguen pudiendo registrar."
                  variant="secondary"
                />
              </form>
            </>
          )
        }
      />

      <div className={tableWrapClass}>
        <table className="w-full max-w-2xl text-left text-sm">
          <thead>
            <tr className={theadRowClass}>
              <th className={thClass}>Lote</th>
              <th className={thClass}>Consumo (m³)</th>
              <th className={thClass}>Total</th>
              <th className={thClass}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {facturas?.map((f) => {
              const lote = f.lote as unknown as { id: string; numero: string } | null;
              return (
                <tr key={f.id} className={trClass}>
                  <td className={tdClass}>
                    {lote && (
                      <Link href={`/admin/facturas/${f.id}`} className="font-medium text-primary hover:underline">
                        {lote.numero}
                      </Link>
                    )}
                  </td>
                  <td className={tdClass}>{f.consumo_m3}</td>
                  <td className={tdClass}>${f.monto_total}</td>
                  <td className={tdClass}>
                    <EstadoBadge estado={f.estado} />
                  </td>
                </tr>
              );
            })}
            {facturas?.length === 0 && (
              <tr>
                <td colSpan={4} className={emptyTdClass}>
                  Todavía no se generó la facturación de este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
