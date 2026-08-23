import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { FacturaCard } from "@/components/factura-card";

function formatPeso(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default async function MisFacturasPage() {
  const supabase = await createClient();
  const { data: facturas } = await supabase
    .from("factura")
    .select("id, mes, anio, estado, monto_total, monto_pagado, vencimiento, lote:lote_id(numero)")
    .order("anio", { ascending: false })
    .order("mes", { ascending: false });

  type Factura = NonNullable<typeof facturas>[number] & {
    lote: { numero: string } | null;
  };

  const todas = (facturas ?? []) as Factura[];
  const pendientes = todas.filter((f) => f.estado !== "pagada");
  const pagadas = todas.filter((f) => f.estado === "pagada");

  const saldoTotal = pendientes.reduce(
    (acc, f) => acc + (Number(f.monto_total) - Number(f.monto_pagado)),
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Mis facturas" />

      {/* Resumen de deuda */}
      {pendientes.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-warning uppercase tracking-wide">Saldo pendiente total</p>
            <p className="text-3xl font-bold text-warning mt-0.5">{formatPeso(saldoTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-warning/80">
              {pendientes.length} factura{pendientes.length !== 1 ? "s" : ""} sin pagar
            </p>
          </div>
        </div>
      )}

      {/* Facturas pendientes */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-warning" />
          Pendientes de pago
          {pendientes.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-warning text-warning-soft text-xs font-bold w-5 h-5">
              {pendientes.length}
            </span>
          )}
        </h2>
        {pendientes.length === 0 ? (
          <div className="rounded-xl border border-success/30 bg-success-soft p-6 text-center">
            <p className="text-2xl mb-1">✓</p>
            <p className="font-semibold text-success">Estás al día con tus pagos</p>
            <p className="text-sm text-success/70 mt-1">No tenés facturas pendientes.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientes.map((f) => (
              <FacturaCard
                key={f.id}
                id={f.id}
                mes={f.mes}
                anio={f.anio}
                estado={f.estado as "pendiente" | "parcial" | "vencida" | "pagada"}
                monto_total={Number(f.monto_total)}
                monto_pagado={Number(f.monto_pagado)}
                vencimiento={f.vencimiento}
                loteNumero={(f.lote as unknown as { numero: string } | null)?.numero ?? null}
              />
            ))}
          </div>
        )}
      </section>

      {/* Historial de facturas pagadas */}
      {pagadas.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            Historial — Facturas pagadas
          </h2>
          <div className="flex flex-col gap-3">
            {pagadas.map((f) => (
              <FacturaCard
                key={f.id}
                id={f.id}
                mes={f.mes}
                anio={f.anio}
                estado="pagada"
                monto_total={Number(f.monto_total)}
                monto_pagado={Number(f.monto_pagado)}
                vencimiento={f.vencimiento}
                loteNumero={(f.lote as unknown as { numero: string } | null)?.numero ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {todas.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-muted-foreground">
            Todavía no hay facturas emitidas.
          </p>
        </div>
      )}
    </div>
  );
}
