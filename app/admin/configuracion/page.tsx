import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { eliminarReglaMora } from "@/lib/actions/mora";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";
import { LoteForm } from "./lote-form";
import { MoraForm } from "./mora-form";

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  const [{ data: lotes }, { data: propietarios }, { data: reglasMora, error: errorReglasMora }] = await Promise.all([
    supabase
      .from("lote")
      .select("id, numero, estado, propietario_id, perfil:propietario_id(nombre)")
      .order("numero"),
    supabase.from("perfil").select("id, nombre").eq("rol", "owner").order("nombre"),
    supabase.from("regla_mora").select("id, dias_desde, recargo_pct").order("dias_desde"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configuración" />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Lotes</h2>
        <div className="flex flex-col gap-4">
          <LoteForm propietarios={propietarios ?? []} />

          <div className={tableWrapClass}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={theadRowClass}>
                  <th className={thClass}>Lote</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Propietario</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody>
                {lotes?.map((l) => (
                  <tr key={l.id} className={trClass}>
                    <td className={tdClass}>
                      <Link href={`/admin/lotes/${l.id}`} className="font-medium text-primary hover:underline">
                        {l.numero}
                      </Link>
                    </td>
                    <td className={tdClass}>
                      <EstadoBadge estado={l.estado} />
                    </td>
                    <td className={tdClass}>
                      {(l.perfil as unknown as { nombre: string } | null)?.nombre ?? "—"}
                    </td>
                    <td className={tdClass}>
                      <Link href={`/admin/configuracion/lotes/${l.id}`} className="text-primary hover:underline">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
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

      <div>
        <h2 className="mb-1 text-sm font-semibold text-foreground">Morosidad</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Recargo por mora según cuántos días de atraso tiene una factura. Se recalcula solo, todos los días, para
          todas las facturas vencidas — no hace falta ningún botón manual. Ej.: &ldquo;desde 30 días, 10%&rdquo;
          aplica ese recargo apenas la factura cumple 30 días vencida, y lo reemplaza por el del tramo siguiente
          cuando corresponda.
        </p>
        {errorReglasMora ? (
          <div className="rounded-xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
            <p className="font-semibold">Falta aplicar una migración en la base de datos.</p>
            <p className="mt-1 text-danger/80">
              Corré esto una vez en el SQL Editor de Supabase y recargá esta página:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-card px-3 py-2 text-xs text-foreground">
              {`create table regla_mora (
  id uuid primary key default gen_random_uuid(),
  dias_desde integer not null check (dias_desde >= 0),
  recargo_pct numeric not null check (recargo_pct >= 0),
  created_at timestamptz not null default now(),
  unique (dias_desde)
);
alter table regla_mora enable row level security;
create policy "admin full access regla_mora" on regla_mora
  for all using (public.is_admin()) with check (public.is_admin());`}
            </pre>
          </div>
        ) : (
          <Card>
            <MoraForm />
            {reglasMora && reglasMora.length > 0 && (
              <ul className="mt-4 flex flex-col divide-y divide-border">
                {reglasMora.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-foreground">
                      Desde {r.dias_desde} días de atraso: <span className="font-medium">{r.recargo_pct}%</span>
                    </span>
                    <form action={eliminarReglaMora.bind(null, r.id)}>
                      <button type="submit" className="text-muted-foreground hover:text-danger" aria-label="Quitar">
                        ×
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            {reglasMora?.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Sin tramos configurados: las facturas vencidas se marcan como tal pero no se les aplica recargo.
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
