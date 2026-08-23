import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarPago } from "@/lib/actions/pagos";
import { FacturaDetalle, type DetalleFactura } from "@/components/factura-detalle";
import { PrintButton } from "@/components/print-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";
import { PagoForm } from "./pago-form";

export default async function FacturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: factura } = await supabase
    .from("factura")
    .select("id, mes, anio, estado, monto_total, monto_pagado, vencimiento, detalle_calculo, lote:lote_id(id, numero, perfil:propietario_id(nombre))")
    .eq("id", id)
    .single();

  if (!factura) notFound();

  const { data: pagos } = await supabase
    .from("pago")
    .select("id, monto, fecha, metodo, comprobante_url, registrado_por:registrado_por(nombre)")
    .eq("factura_id", id)
    .order("fecha", { ascending: false });

  const pagosConUrl = await Promise.all(
    (pagos ?? []).map(async (p) => {
      if (!p.comprobante_url) return { ...p, url: null as string | null };
      const { data } = await supabase.storage
        .from("comprobantes")
        .createSignedUrl(p.comprobante_url, 3600);
      return { ...p, url: data?.signedUrl ?? null };
    }),
  );

  const lote = factura.lote as unknown as {
    id: string;
    numero: string;
    perfil: { nombre: string } | null;
  } | null;
  const saldo = Number(factura.monto_total) - Number(factura.monto_pagado);
  const addAction = registrarPago.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <>
            Factura {factura.mes}/{factura.anio}
            {lote && (
              <>
                {" — "}
                <Link href={`/admin/lotes/${lote.id}`} className="text-primary hover:underline print:hidden">
                  Lote {lote.numero}
                </Link>
                <span className="hidden print:inline">Lote {lote.numero}</span>
              </>
            )}
          </>
        }
        subtitle={
          <>
            {lote?.perfil?.nombre ?? "Sin propietario asignado"} · Vence {factura.vencimiento} ·{" "}
            <EstadoBadge estado={factura.estado} />
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

      {saldo > 0 && (
        <Card className="print:hidden">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Registrar pago</h2>
          <PagoForm action={addAction} />
        </Card>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Pagos registrados</h2>
        <div className={tableWrapClass}>
          <table className="w-full max-w-lg text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Monto</th>
                <th className={thClass}>Método</th>
                <th className={thClass}>Comprobante</th>
                <th className={`${thClass} print:hidden`}>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {pagosConUrl.map((p) => {
                const registradoPor = p.registrado_por as unknown as { nombre: string } | null;
                return (
                  <tr key={p.id} className={trClass}>
                    <td className={tdClass}>{p.fecha}</td>
                    <td className={tdClass}>${p.monto}</td>
                    <td className={`${tdClass} capitalize`}>{p.metodo.replace("_", " ")}</td>
                    <td className={tdClass}>
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noreferrer" className="text-primary hover:underline print:hidden">
                          Ver
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`${tdClass} print:hidden`}>{registradoPor?.nombre ?? "—"}</td>
                  </tr>
                );
              })}
              {pagosConUrl.length === 0 && (
                <tr>
                  <td colSpan={5} className={emptyTdClass}>
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
