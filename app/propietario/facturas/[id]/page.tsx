import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FacturaDetalle, type DetalleFactura } from "@/components/factura-detalle";
import { PrintButton } from "@/components/print-button";
import { PagoFormOwner } from "@/components/pago-form-owner";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatPeso(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMetodo(m: string) {
  return m === "mercado_pago" ? "Mercado Pago" : m.charAt(0).toUpperCase() + m.slice(1);
}

function formatFecha(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MiFacturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: factura } = await supabase
    .from("factura")
    .select("id, mes, anio, estado, monto_total, monto_pagado, vencimiento, detalle_calculo, lote:lote_id(numero)")
    .eq("id", id)
    .single();

  if (!factura) notFound();

  const { data: pagos } = await supabase
    .from("pago")
    .select("id, monto, fecha, metodo, estado, comprobante_url")
    .eq("factura_id", id)
    .order("fecha", { ascending: false });

  const lote = factura.lote as unknown as { numero: string } | null;
  const saldo = Number(factura.monto_total) - Number(factura.monto_pagado);
  const isPagada = factura.estado === "pagada";
  const isVencida = factura.estado === "vencida";
  const pctPagado = Number(factura.monto_total) > 0
    ? Math.round((Number(factura.monto_pagado) / Number(factura.monto_total)) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${MESES[factura.mes - 1]} ${factura.anio} — Lote ${lote?.numero}`}
        subtitle={
          <>
            Vence {formatFecha(factura.vencimiento)} · <EstadoBadge estado={factura.estado} />
          </>
        }
        actions={<PrintButton />}
      />

      {/* ── Resumen hero ─────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border p-5 ${
          isPagada
            ? "border-success/30 bg-success-soft"
            : isVencida
              ? "border-danger/30 bg-danger-soft"
              : "border-primary/20 bg-primary-soft"
        }`}
      >
        <p
          className={`text-xs font-bold uppercase tracking-widest ${
            isPagada ? "text-success" : isVencida ? "text-danger" : "text-primary"
          }`}
        >
          {isPagada ? "Factura pagada" : isVencida ? "⚠ Vencida — saldo pendiente" : "Saldo a pagar"}
        </p>
        <p
          className={`text-4xl font-extrabold mt-1 tracking-tight ${
            isPagada ? "text-success" : isVencida ? "text-danger" : "text-foreground"
          }`}
        >
          {isPagada ? formatPeso(Number(factura.monto_total)) : formatPeso(saldo)}
        </p>
        {!isPagada && Number(factura.monto_pagado) > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Ya abonado: {formatPeso(Number(factura.monto_pagado))}
          </p>
        )}

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{pctPagado}% pagado</span>
            <span>Total: {formatPeso(Number(factura.monto_total))}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-card/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isPagada ? "bg-success" : isVencida ? "bg-danger" : "bg-primary"
              }`}
              style={{ width: `${Math.min(pctPagado, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Layout: form de pago (izq/top) + desglose (der/bot) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Columna derecha en desktop: formulario de pago */}
        <div className="lg:col-start-2 lg:row-start-1" id="pagar">
          {!isPagada ? (
            <div className="print:hidden sticky top-4">
              <h2 className="mb-3 text-base font-bold text-foreground">Registrá tu pago</h2>
              <Card>
                <PagoFormOwner facturaId={id} saldo={saldo} />
              </Card>
            </div>
          ) : (
            /* Factura pagada: mostrar resumen de pagos en este espacio */
            <div>
              <h2 className="mb-3 text-base font-bold text-foreground">Pagos realizados</h2>
              <div className="flex flex-col gap-2">
                {pagos?.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{formatPeso(Number(p.monto))}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFecha(p.fecha)} · {formatMetodo(p.metodo)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.estado === "pendiente" && (
                        <span className="text-xs rounded-full bg-warning-soft text-warning px-2.5 py-0.5 font-semibold">
                          Pendiente
                        </span>
                      )}
                      {p.comprobante_url && (
                        <a
                          href={`/propietario/facturas/${id}/comprobante/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Ver comprobante
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna izquierda en desktop */}
        <div className="lg:col-start-1 lg:row-start-1 flex flex-col gap-6">
          {/* Desglose de consumo */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Detalle del consumo</h2>
            <Card>
              <FacturaDetalle detalle={factura.detalle_calculo as DetalleFactura} />
            </Card>
          </section>

          {/* Historial de pagos (si no está pagada, los mostramos aquí) */}
          {!isPagada && pagos && pagos.length > 0 && (
            <section className="print:hidden">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Pagos anteriores registrados</h2>
              <div className="flex flex-col gap-2">
                {pagos.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{formatPeso(Number(p.monto))}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFecha(p.fecha)} · {formatMetodo(p.metodo)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.estado === "pendiente" && (
                        <span className="text-xs rounded-full bg-warning-soft text-warning px-2.5 py-0.5 font-semibold">
                          Pendiente confirmación
                        </span>
                      )}
                      {p.comprobante_url && (
                        <a
                          href={`/propietario/facturas/${id}/comprobante/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Ver comprobante
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
