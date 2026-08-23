import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FacturaDetalle, type DetalleFactura } from "@/components/factura-detalle";
import { PrintButton } from "@/components/print-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";

export default async function MiFacturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS ya restringe esto a facturas de lotes propios; si no es suya, no aparece.
  const { data: factura } = await supabase
    .from("factura")
    .select("id, mes, anio, estado, monto_total, monto_pagado, vencimiento, detalle_calculo, lote:lote_id(numero)")
    .eq("id", id)
    .single();

  if (!factura) notFound();

  const { data: pagos } = await supabase
    .from("pago")
    .select("id, monto, fecha, metodo")
    .eq("factura_id", id)
    .order("fecha", { ascending: false });

  const lote = factura.lote as unknown as { numero: string } | null;
  const saldo = Number(factura.monto_total) - Number(factura.monto_pagado);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Factura ${factura.mes}/${factura.anio} — Lote ${lote?.numero}`}
        subtitle={
          <>
            Vence {factura.vencimiento} · <EstadoBadge estado={factura.estado} />
          </>
        }
        actions={<PrintButton />}
      />

      <Card className="max-w-md">
        <FacturaDetalle detalle={factura.detalle_calculo as DetalleFactura} />
        <p className="mt-2 flex justify-between text-sm font-medium text-foreground">
          <span>Saldo pendiente</span>
          <span>${saldo.toFixed(2)}</span>
        </p>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Pagos registrados</h2>
        <div className={tableWrapClass}>
          <table className="w-full max-w-md text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Monto</th>
                <th className={thClass}>Método</th>
              </tr>
            </thead>
            <tbody>
              {pagos?.map((p) => (
                <tr key={p.id} className={trClass}>
                  <td className={tdClass}>{p.fecha}</td>
                  <td className={tdClass}>${p.monto}</td>
                  <td className={`${tdClass} capitalize`}>{p.metodo.replace("_", " ")}</td>
                </tr>
              ))}
              {pagos?.length === 0 && (
                <tr>
                  <td colSpan={3} className={emptyTdClass}>
                    Todavía no hay pagos registrados.
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
