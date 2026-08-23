import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EstadoBadge } from "@/components/ui/badge";
import { ConsumoChart } from "@/components/consumo-chart";

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

function formatFecha(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export default async function PropietarioDashboardPage() {
  const supabase = await createClient();

  const [{ data: lotes }, { data: facturas }] = await Promise.all([
    supabase.from("lote").select("id, numero, estado"),
    supabase
      .from("factura")
      .select("id, mes, anio, estado, monto_total, monto_pagado, vencimiento, detalle_calculo")
      .order("vencimiento", { ascending: true }),
  ]);

  const todasLasFacturas = facturas ?? [];

  const consumoReciente = [...todasLasFacturas]
    .sort((a, b) => a.anio - b.anio || a.mes - b.mes)
    .slice(-6)
    .map((f) => ({
      mes: f.mes,
      anio: f.anio,
      consumo_m3: Number((f.detalle_calculo as { consumo_m3?: number } | null)?.consumo_m3 ?? 0),
    }));
  const pendientes = todasLasFacturas.filter((f) => f.estado !== "pagada");
  const vencidas = pendientes.filter((f) => f.estado === "vencida");

  const saldoTotal = pendientes.reduce(
    (acc, f) => acc + (Number(f.monto_total) - Number(f.monto_pagado)),
    0,
  );

  // Próximas 3 a vencer (no vencidas todavía)
  const proximasAVencer = pendientes
    .filter((f) => f.estado !== "vencida")
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inicio" />

      {/* Banner de deuda */}
      {saldoTotal > 0 ? (
        <div
          className={`rounded-xl border p-5 ${
            vencidas.length > 0
              ? "border-danger/30 bg-danger-soft"
              : "border-warning/30 bg-warning-soft"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {vencidas.length > 0 && (
                <p className="text-xs font-bold text-danger uppercase tracking-wide mb-1">
                  ⚠ Tenés {vencidas.length} factura{vencidas.length !== 1 ? "s" : ""} vencida{vencidas.length !== 1 ? "s" : ""}
                </p>
              )}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Saldo pendiente total
              </p>
              <p
                className={`text-3xl font-bold mt-0.5 ${
                  vencidas.length > 0 ? "text-danger" : "text-warning"
                }`}
              >
                {formatPeso(saldoTotal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {pendientes.length} factura{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link href="/propietario/facturas">
              <Button size="sm">Ver todas mis facturas</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-success/30 bg-success-soft p-5 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-semibold text-success">Estás al día con tus pagos</p>
            <p className="text-sm text-success/70">No tenés facturas pendientes.</p>
          </div>
        </div>
      )}

      {/* Próximas a vencer */}
      {proximasAVencer.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Próximas a vencer</h2>
          <div className="flex flex-col gap-2">
            {proximasAVencer.map((f) => {
              const saldo = Number(f.monto_total) - Number(f.monto_pagado);
              return (
                <Link
                  key={f.id}
                  href={`/propietario/facturas/${f.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {MESES[f.mes - 1]} {f.anio}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vence {formatFecha(f.vencimiento)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-foreground">{formatPeso(saldo)}</p>
                    <EstadoBadge estado={f.estado} />
                  </div>
                </Link>
              );
            })}
          </div>
          {pendientes.length > 3 && (
            <Link
              href="/propietario/facturas"
              className="mt-3 block text-sm font-medium text-primary hover:underline"
            >
              Ver {pendientes.length - 3} más →
            </Link>
          )}
        </div>
      )}

      <ConsumoChart datos={consumoReciente} />

      {/* Mis lotes */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Mis lotes</h2>
        <div className="flex flex-col gap-2">
          {lotes?.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="text-sm font-medium">Lote {l.numero}</span>
              <EstadoBadge estado={l.estado} />
            </div>
          ))}
          {lotes?.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
              </svg>
              <p className="text-sm text-muted-foreground">
                Todavía no tenés lotes asignados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
