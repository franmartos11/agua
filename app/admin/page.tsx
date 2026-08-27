import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerMorosidad } from "@/lib/deuda";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { PagoBadge, type PagoEstado } from "@/components/ui/badge";
import { ContactButtons } from "@/components/ui/contact-buttons";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ data: lotes }, { count: totalPropietarios }, morosidad] = await Promise.all([
    supabase
      .from("lote")
      .select("id, numero, estado, propietario_id, perfil:propietario_id(nombre, email, telefono)")
      .order("numero"),
    supabase.from("perfil").select("id", { count: "exact", head: true }).eq("rol", "owner"),
    obtenerMorosidad(supabase),
  ]);

  const deudaTotal = morosidad.reduce((acc, d) => acc + d.saldo, 0);
  const lotesConDeudaIds = new Set(morosidad.flatMap((d) => d.loteIds));
  const lotesConDeuda = lotesConDeudaIds.size;
  const lotesAlDia = (lotes?.length ?? 0) - lotesConDeuda;

  function pagoEstado(loteId: string, propietarioId: string | null): PagoEstado {
    if (!propietarioId) return "sin-propietario";
    return lotesConDeudaIds.has(loteId) ? "con-deuda" : "al-dia";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inicio" subtitle="Quién debe, cuánto, y a quién llamar" />

      <div className="flex flex-wrap gap-4">
        <StatCard label="Deuda total pendiente" value={`$${deudaTotal.toFixed(2)}`} tone={deudaTotal > 0 ? "danger" : "success"} />
        <Link href="/admin/lotes?deuda=1" className="flex-1 min-w-[10rem]">
          <StatCard label="Lotes con deuda" value={lotesConDeuda} tone={lotesConDeuda > 0 ? "warning" : "success"} className="h-full" clickable />
        </Link>
        <StatCard label="Lotes al día" value={lotesAlDia} tone="success" />
        <StatCard label="Propietarios registrados" value={totalPropietarios ?? 0} />
      </div>

      {(lotes?.length ?? 0) > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Salud de cobranza</span>
            <span>
              {lotesAlDia} al día · {lotesConDeuda} con deuda
            </span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            {lotesAlDia > 0 && (
              <div
                className="h-full bg-success"
                style={{ width: `${(lotesAlDia / (lotes!.length)) * 100}%` }}
              />
            )}
            {lotesConDeuda > 0 && (
              <div
                className="h-full bg-danger"
                style={{ width: `${(lotesConDeuda / (lotes!.length)) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Quién debe</h2>
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Propietario</th>
                <th className={thClass}>Lotes</th>
                <th className={thClass}>Facturas impagas</th>
                <th className={thClass}>Saldo</th>
                <th className={thClass}>Contacto</th>
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
                  <td className={tdClass}>
                    {d.loteIds.length > 0
                      ? d.loteIds.map((loteId, i) => (
                          <span key={loteId}>
                            {i > 0 && ", "}
                            <Link href={`/admin/lotes/${loteId}`} className="text-primary hover:underline">
                              {d.lotesNumeros[i]}
                            </Link>
                          </span>
                        ))
                      : "—"}
                  </td>
                  <td className={tdClass}>{d.facturasImpagas}</td>
                  <td className={`${tdClass} font-medium text-danger`}>${d.saldo.toFixed(2)}</td>
                  <td className={tdClass}>
                    <ContactButtons email={d.email} telefono={d.telefono} />
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
                <th className={thClass}>Pago</th>
                <th className={thClass}>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {lotes?.map((l) => {
                const propietario = l.perfil as unknown as { nombre: string; email: string | null; telefono: string | null } | null;
                const pago = pagoEstado(l.id, l.propietario_id);
                return (
                  <tr key={l.id} className={trClass}>
                    <td className={tdClass}>
                      <Link href={`/admin/lotes/${l.id}`} className="font-medium text-primary hover:underline">
                        {l.numero}
                      </Link>
                    </td>
                    <td className={tdClass}>
                      {l.propietario_id ? (
                        <Link href={`/admin/propietarios/${l.propietario_id}`} className="text-primary hover:underline">
                          {propietario?.nombre}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={tdClass}>
                      <PagoBadge estado={pago} />
                    </td>
                    <td className={tdClass}>
                      <ContactButtons email={propietario?.email} telefono={propietario?.telefono} />
                    </td>
                  </tr>
                );
              })}
              {lotes?.length === 0 && (
                <tr>
                  <td colSpan={4} className={emptyTdClass}>
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
