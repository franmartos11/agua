import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generarFacturas, cerrarPeriodo } from "@/lib/actions/periodos";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";
import { BoletaEpasForm } from "./boleta-epas-form";

export default async function PeriodoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: periodo, error: errorPeriodo } = await supabase
    .from("periodo_facturacion")
    .select("id, mes, anio, fecha_vencimiento, estado, epas_m3, epas_monto")
    .eq("id", id)
    .single();

  if (errorPeriodo?.message.includes("epas_m3")) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        <p className="font-semibold">Falta aplicar una migración en la base de datos.</p>
        <p className="mt-1 text-danger/80">
          Corré esto una vez en el SQL Editor de Supabase y recargá esta página:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-card px-3 py-2 text-xs text-foreground">
          alter table periodo_facturacion add column epas_m3 numeric;{"\n"}
          alter table periodo_facturacion add column epas_monto numeric;
        </pre>
      </div>
    );
  }

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
            <form action={cerrarPeriodo.bind(null, id)}>
              <ConfirmSubmitButton
                label="Cerrar período"
                confirmText="Al cerrar el período ya no se va a poder regenerar la facturación. Los pagos se siguen pudiendo registrar."
                variant="secondary"
              />
            </form>
          )
        }
      />

      {abierto && (
        <>
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-foreground">1. Cargar factura del período</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Cargá los m³ y el monto de la boleta de EPAS del macromedidor para repartir el consumo entre los
              lotes a precio único (regla de tres simple), en vez de usar los tramos de la tarifa. Dejá los dos
              campos vacíos para volver a usar tramos.
            </p>
            <BoletaEpasForm
              periodoId={id}
              epasM3={periodo.epas_m3}
              epasMonto={periodo.epas_monto}
            />
          </Card>

          <Card>
            <h2 className="mb-1 text-sm font-semibold text-foreground">2. Calcular facturación</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Calcula la factura de cada lote según las lecturas cargadas, la tarifa vigente y la boleta de EPAS
              (si la cargaste arriba). Si ya había facturas generadas para este período, se reemplazan.
            </p>
            <form action={generarFacturas.bind(null, id)}>
              <ConfirmSubmitButton
                label={facturas && facturas.length > 0 ? "Regenerar facturación" : "Generar facturación"}
                confirmText="Esto calcula (o recalcula) la factura de cada lote para este período según las lecturas y la tarifa vigente. Si ya había facturas generadas, se reemplazan."
                variant="primary"
              />
            </form>
          </Card>
        </>
      )}

      <div>
        {abierto && <h2 className="mb-2 text-sm font-semibold text-foreground">Facturas de este período</h2>}
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
    </div>
  );
}
