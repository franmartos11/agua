import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerMorosidad } from "@/lib/deuda";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ data: lotes }, { count: totalPropietarios }, morosidad] = await Promise.all([
    supabase
      .from("lote")
      .select("id, numero, estado, perfil:propietario_id(nombre)")
      .order("numero"),
    supabase.from("perfil").select("id", { count: "exact", head: true }).eq("rol", "owner"),
    obtenerMorosidad(supabase),
  ]);

  const deudaTotal = morosidad.reduce((acc, d) => acc + d.saldo, 0);
  const lotesConDeuda = new Set(morosidad.flatMap((d) => d.loteIds)).size;
  const lotesAlDia = (lotes?.length ?? 0) - lotesConDeuda;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inicio" subtitle="Quién debe, cuánto, y a quién llamar" />

      <div className="flex flex-wrap gap-4">
        <StatCard label="Deuda total pendiente" value={`$${deudaTotal.toFixed(2)}`} tone={deudaTotal > 0 ? "danger" : "success"} />
        <StatCard label="Lotes con deuda" value={lotesConDeuda} tone={lotesConDeuda > 0 ? "warning" : "success"} />
        <StatCard label="Lotes al día" value={lotesAlDia} tone="success" />
        <StatCard label="Propietarios registrados" value={totalPropietarios ?? 0} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Quién debe</h2>
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Propietario</th>
                <th className={thClass}>Teléfono</th>
                <th className={thClass}>Lotes</th>
                <th className={thClass}>Facturas impagas</th>
                <th className={thClass}>Saldo</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {morosidad.map((d) => (
                <tr key={d.propietarioId ?? "sin-propietario"} className={trClass}>
                  <td className={tdClass}>{d.nombre}</td>
                  <td className={tdClass}>{d.telefono ?? "—"}</td>
                  <td className={tdClass}>{d.lotesNumeros.join(", ") || "—"}</td>
                  <td className={tdClass}>{d.facturasImpagas}</td>
                  <td className={`${tdClass} font-medium text-danger`}>${d.saldo.toFixed(2)}</td>
                  <td className={tdClass}>
                    {d.propietarioId ? (
                      <Link href={`/admin/pagos?propietario=${d.propietarioId}`} className="font-medium text-primary hover:underline">
                        Cobrar
                      </Link>
                    ) : (
                      d.loteIds[0] && (
                        <Link href={`/admin/lotes/${d.loteIds[0]}`} className="font-medium text-primary hover:underline">
                          Ver lote
                        </Link>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {morosidad.length === 0 && (
                <tr>
                  <td colSpan={6} className={emptyTdClass}>
                    Nadie tiene deuda pendiente 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Lotes y estado de pago</h2>
          <Link href="/admin/pagos" className="text-sm font-medium text-primary hover:underline">
            Ver cobranzas →
          </Link>
        </div>
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Lote</th>
                <th className={thClass}>Propietario</th>
                <th className={thClass}>Estado lote</th>
              </tr>
            </thead>
            <tbody>
              {lotes?.map((l) => {
                const propietario = l.perfil as unknown as { nombre: string } | null;
                return (
                  <tr key={l.id} className={trClass}>
                    <td className={tdClass}>
                      <Link href={`/admin/lotes/${l.id}`} className="font-medium text-primary hover:underline">
                        {l.numero}
                      </Link>
                    </td>
                    <td className={tdClass}>{propietario?.nombre ?? "Sin propietario"}</td>
                    <td className={tdClass}>
                      <EstadoBadge estado={l.estado} />
                    </td>
                  </tr>
                );
              })}
              {lotes?.length === 0 && (
                <tr>
                  <td colSpan={3} className={emptyTdClass}>
                    Todavía no hay lotes cargados.
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
