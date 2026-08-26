import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { ConsumoChart } from "@/components/consumo-chart";
import { PeriodoSelector } from "./periodo-selector";

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

export default async function PropietarioDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: lotes }, { data: facturas }] = await Promise.all([
    supabase.from("lote").select("id, numero, estado"),
    supabase
      .from("factura")
      .select("id, mes, anio, estado, monto_total, monto_pagado, consumo_m3, vencimiento, lote:lote_id(numero)")
      .order("vencimiento", { ascending: true }),
  ]);

  const todasLasFacturas = facturas ?? [];

  const periodosMap = new Map<string, { mes: number; anio: number }>();
  for (const f of todasLasFacturas) {
    periodosMap.set(`${f.anio}-${f.mes}`, { mes: f.mes, anio: f.anio });
  }
  const periodos = [...periodosMap.values()].sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  const periodoSeleccionado =
    periodos.find((p) => `${p.anio}-${String(p.mes).padStart(2, "0")}` === periodoParam) ?? periodos[0];

  const facturasDelPeriodo = periodoSeleccionado
    ? todasLasFacturas.filter((f) => f.mes === periodoSeleccionado.mes && f.anio === periodoSeleccionado.anio)
    : [];
  const totalAPagarPeriodo = facturasDelPeriodo.reduce((acc, f) => acc + Number(f.monto_total), 0);
  const consumoTotalPeriodo = facturasDelPeriodo.reduce((acc, f) => acc + Number(f.consumo_m3 ?? 0), 0);

  const consumoPorPeriodo = new Map<string, number>();
  for (const f of todasLasFacturas) {
    const key = `${f.anio}-${f.mes}`;
    consumoPorPeriodo.set(key, (consumoPorPeriodo.get(key) ?? 0) + Number(f.consumo_m3 ?? 0));
  }
  const consumoReciente = periodos
    .slice(0, 6)
    .reverse()
    .map((p) => ({ mes: p.mes, anio: p.anio, consumo_m3: consumoPorPeriodo.get(`${p.anio}-${p.mes}`) ?? 0 }));
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

      {/* Tu boleta por mes */}
      {periodos.length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Tu boleta por mes</h2>
            <PeriodoSelector
              periodos={periodos}
              selected={`${periodoSeleccionado.anio}-${String(periodoSeleccionado.mes).padStart(2, "0")}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-xs font-medium text-muted-foreground">
                Total a pagar · {MESES[periodoSeleccionado.mes - 1]} {periodoSeleccionado.anio}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{formatPeso(totalAPagarPeriodo)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-muted-foreground">Consumo total de agua</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{consumoTotalPeriodo} m³</p>
            </Card>
          </div>
          {facturasDelPeriodo.length === 1 ? (
            <Link
              href={`/propietario/facturas/${facturasDelPeriodo[0].id}`}
              className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all"
            >
              <span className="text-sm font-medium text-primary">Ver el detalle de esta boleta</span>
              <EstadoBadge estado={facturasDelPeriodo[0].estado} />
            </Link>
          ) : (
            facturasDelPeriodo.length > 1 && (
              <div className="mt-3 flex flex-col gap-2">
                {facturasDelPeriodo.map((f) => {
                  const lote = f.lote as unknown as { numero: string } | null;
                  return (
                    <Link
                      key={f.id}
                      href={`/propietario/facturas/${f.id}`}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all"
                    >
                      <span className="text-sm font-medium text-foreground">Lote {lote?.numero}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">{formatPeso(Number(f.monto_total))}</span>
                        <EstadoBadge estado={f.estado} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

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
