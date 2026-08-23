import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerMorosidad } from "@/lib/deuda";
import { ExportCsvButton } from "@/components/export-csv-button";
import { PrintButton } from "@/components/print-button";
import { RecaudacionChart } from "@/components/recaudacion-chart";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";

const MESES_ABR = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export default async function ReportesPage() {
  const supabase = await createClient();

  const [morosidad, { data: facturas }, { data: pagos }] = await Promise.all([
    obtenerMorosidad(supabase),
    supabase
      .from("factura")
      .select("id, mes, anio, consumo_m3, monto_total, monto_pagado, estado, lote:lote_id(numero, propietario_id, perfil:propietario_id(nombre))")
      .order("anio", { ascending: false })
      .order("mes", { ascending: false }),
    supabase.from("pago").select("monto, factura:factura_id(mes, anio)"),
  ]);

  type LoteInfo = { numero: string; propietario_id: string | null; perfil: { nombre: string } | null };
  const filas = (facturas ?? []).map((f) => ({
    ...f,
    lote: f.lote as unknown as LoteInfo | null,
  }));

  // Recaudación por período
  const recaudacionPorPeriodo = new Map<string, number>();
  const recaudacionPorPeriodoOrdenada = new Map<string, { mes: number; anio: number; monto: number }>();
  let recaudacionTotal = 0;
  for (const p of pagos ?? []) {
    const periodo = p.factura as unknown as { mes: number; anio: number } | null;
    const clave = periodo ? `${periodo.mes}/${periodo.anio}` : "sin período";
    recaudacionPorPeriodo.set(clave, (recaudacionPorPeriodo.get(clave) ?? 0) + Number(p.monto));
    if (periodo) {
      const acumulado = recaudacionPorPeriodoOrdenada.get(clave)?.monto ?? 0;
      recaudacionPorPeriodoOrdenada.set(clave, { mes: periodo.mes, anio: periodo.anio, monto: acumulado + Number(p.monto) });
    }
    recaudacionTotal += Number(p.monto);
  }

  const recaudacionChartData = [...recaudacionPorPeriodoOrdenada.values()]
    .sort((a, b) => a.anio - b.anio || a.mes - b.mes)
    .slice(-6)
    .map((d) => ({ periodo: `${MESES_ABR[d.mes - 1]} ${d.anio}`, monto: d.monto }));

  const filasConsumoCsv = filas.map((f) => ({
    lote: f.lote?.numero ?? "",
    propietario: f.lote?.perfil?.nombre ?? "",
    periodo: `${f.mes}/${f.anio}`,
    consumo_m3: f.consumo_m3,
    monto_total: f.monto_total,
    estado: f.estado,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Reportes" actions={<PrintButton />} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Morosidad por propietario</h2>
        <div className={tableWrapClass}>
          <table className="w-full max-w-2xl text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Propietario</th>
                <th className={thClass}>Teléfono</th>
                <th className={thClass}>Facturas sin pagar</th>
                <th className={thClass}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {morosidad.map((d) => (
                <tr key={d.propietarioId ?? "sin-propietario"} className={trClass}>
                  <td className={tdClass}>
                    {d.propietarioId ? (
                      <Link href={`/admin/propietarios/${d.propietarioId}`} className="font-medium text-primary hover:underline">
                        {d.nombre}
                      </Link>
                    ) : (
                      d.nombre
                    )}
                  </td>
                  <td className={tdClass}>{d.telefono ?? "—"}</td>
                  <td className={tdClass}>{d.facturasImpagas}</td>
                  <td className={`${tdClass} font-medium text-danger`}>${d.saldo.toFixed(2)}</td>
                </tr>
              ))}
              {morosidad.length === 0 && (
                <tr>
                  <td colSpan={4} className={emptyTdClass}>
                    No hay deuda pendiente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Consumo y facturación por lote/período</h2>
          <ExportCsvButton rows={filasConsumoCsv} filename="consumo_facturacion.csv" />
        </div>
        <div className={tableWrapClass}>
          <table className="w-full max-w-3xl text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Lote</th>
                <th className={thClass}>Propietario</th>
                <th className={thClass}>Período</th>
                <th className={thClass}>Consumo (m³)</th>
                <th className={thClass}>Total</th>
                <th className={thClass}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className={trClass}>
                  <td className={tdClass}>{f.lote?.numero}</td>
                  <td className={tdClass}>
                    {f.lote?.propietario_id ? (
                      <Link href={`/admin/propietarios/${f.lote.propietario_id}`} className="text-primary hover:underline">
                        {f.lote?.perfil?.nombre ?? "—"}
                      </Link>
                    ) : (
                      f.lote?.perfil?.nombre ?? "—"
                    )}
                  </td>
                  <td className={tdClass}>
                    <Link href={`/admin/facturas/${f.id}`} className="text-primary hover:underline">
                      {f.mes}/{f.anio}
                    </Link>
                  </td>
                  <td className={tdClass}>{f.consumo_m3}</td>
                  <td className={tdClass}>${f.monto_total}</td>
                  <td className={tdClass}>
                    <EstadoBadge estado={f.estado} />
                  </td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={6} className={emptyTdClass}>
                    Todavía no hay facturas generadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Recaudación</h2>
        <Card className="mb-3">
          <p className="text-sm text-muted-foreground">Total histórico</p>
          <p className="text-2xl font-semibold text-foreground">${recaudacionTotal.toFixed(2)}</p>
        </Card>
        <RecaudacionChart datos={recaudacionChartData} />
        <div className={tableWrapClass}>
          <table className="w-full max-w-sm text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Período</th>
                <th className={thClass}>Recaudado</th>
              </tr>
            </thead>
            <tbody>
              {[...recaudacionPorPeriodo.entries()].map(([periodo, monto]) => (
                <tr key={periodo} className={trClass}>
                  <td className={tdClass}>{periodo}</td>
                  <td className={tdClass}>${monto.toFixed(2)}</td>
                </tr>
              ))}
              {recaudacionPorPeriodo.size === 0 && (
                <tr>
                  <td colSpan={2} className={emptyTdClass}>
                    Todavía no hay pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
