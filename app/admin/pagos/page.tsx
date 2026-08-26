import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { confirmarPagoOwner, rechazarPagoOwner } from "@/lib/actions/pagos";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass } from "@/components/ui/table";

function formatMetodo(m: string) {
  return m === "mercado_pago" ? "Mercado Pago" : m.charAt(0).toUpperCase() + m.slice(1);
}

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ propietario?: string }>;
}) {
  const { propietario } = await searchParams;
  const supabase = await createClient();
  const [{ data: facturas }, { data: pagosPendientes }] = await Promise.all([
    supabase
      .from("factura")
      .select(
        "id, mes, anio, estado, monto_total, monto_pagado, vencimiento, detalle_calculo, lote:lote_id(numero, propietario_id, perfil:propietario_id(nombre, telefono))",
      )
      .in("estado", ["pendiente", "parcial", "vencida"])
      .order("vencimiento"),
    supabase
      .from("pago")
      .select(
        "id, monto, fecha, metodo, comprobante_url, factura:factura_id(id, mes, anio, lote:lote_id(numero, propietario_id, perfil:propietario_id(nombre, telefono)))",
      )
      .eq("estado", "pendiente")
      .order("fecha", { ascending: false }),
  ]);

  type FacturaLote = { numero: string; propietario_id: string | null; perfil: { nombre: string; telefono: string | null } | null };
  const todas = (facturas ?? []).map((f) => ({ ...f, lote: f.lote as unknown as FacturaLote | null }));

  const filtradas = propietario ? todas.filter((f) => f.lote?.propietario_id === propietario) : todas;
  const nombreFiltro = propietario ? filtradas[0]?.lote?.perfil?.nombre : undefined;

  type PagoPendienteFactura = { id: string; mes: number; anio: number; lote: FacturaLote | null };
  const pendientesTodos = (pagosPendientes ?? []).map((p) => ({
    ...p,
    factura: p.factura as unknown as PagoPendienteFactura | null,
  }));
  const pendientesFiltrados = propietario
    ? pendientesTodos.filter((p) => p.factura?.lote?.propietario_id === propietario)
    : pendientesTodos;

  const pendientesConUrl = await Promise.all(
    pendientesFiltrados.map(async (p) => {
      if (!p.comprobante_url) return { ...p, url: null as string | null };
      const { data } = await supabase.storage.from("comprobantes").createSignedUrl(p.comprobante_url, 3600);
      return { ...p, url: data?.signedUrl ?? null };
    }),
  );

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
      />

      {pendientesConUrl.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            Pagos por aprobar
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Declarados por el propietario, esperando confirmación del administrador.
            </span>
          </h2>
          <div className="flex flex-col gap-3">
            {pendientesConUrl.map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {p.factura?.lote?.propietario_id ? (
                      <Link
                        href={`/admin/propietarios/${p.factura.lote.propietario_id}`}
                        className="text-primary hover:underline"
                      >
                        {p.factura?.lote?.perfil?.nombre ?? "—"}
                      </Link>
                    ) : (
                      p.factura?.lote?.perfil?.nombre ?? "—"
                    )}
                    {" — "}
                    <Link href={`/admin/facturas/${p.factura?.id}`} className="text-primary hover:underline">
                      Lote {p.factura?.lote?.numero} · {p.factura?.mes}/{p.factura?.anio}
                    </Link>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.fecha} · {formatMetodo(p.metodo)} ·{" "}
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Ver comprobante
                      </a>
                    ) : (
                      "sin comprobante"
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-foreground">${Number(p.monto).toFixed(2)}</p>
                  <form action={rechazarPagoOwner.bind(null, p.id)}>
                    <ConfirmSubmitButton
                      label="Rechazar"
                      confirmText="¿Rechazar este pago? El propietario ya no lo va a ver como pendiente y podrá volver a declararlo si corresponde."
                      variant="danger"
                    />
                  </form>
                  <form action={confirmarPagoOwner.bind(null, p.id)}>
                    <ConfirmSubmitButton
                      label="Aprobar"
                      confirmText="¿Aprobar este pago? Se va a descontar del saldo de la factura."
                      variant="primary"
                    />
                  </form>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

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
                <th className={thClass}>Días de atraso</th>
                <th className={thClass}>Saldo</th>
                <th className={thClass}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((f) => {
                const saldo = Number(f.monto_total) - Number(f.monto_pagado);
                const detalle = f.detalle_calculo as { dias_atraso?: number; mora_pct_aplicado?: number } | null;
                return (
                  <tr key={f.id} className={trClass}>
                    <td className={tdClass}>
                      <Link href={`/admin/facturas/${f.id}`} className="font-medium text-primary hover:underline">
                        {f.lote?.numero}
                      </Link>
                    </td>
                    <td className={tdClass}>
                      {f.lote?.propietario_id ? (
                        <Link href={`/admin/propietarios/${f.lote.propietario_id}`} className="text-primary hover:underline">
                          {f.lote?.perfil?.nombre ?? "—"}
                        </Link>
                      ) : (
                        f.lote?.perfil?.nombre ?? "—"
                      )}
                    </td>
                    <td className={tdClass}>{f.lote?.perfil?.telefono ?? "—"}</td>
                    <td className={tdClass}>{f.mes}/{f.anio}</td>
                    <td className={tdClass}>{f.vencimiento}</td>
                    <td className={tdClass}>
                      {detalle?.dias_atraso
                        ? `${detalle.dias_atraso} días${detalle.mora_pct_aplicado ? ` (+${detalle.mora_pct_aplicado}%)` : ""}`
                        : "—"}
                    </td>
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
