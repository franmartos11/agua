import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";
import { LoteForm } from "./lote-form";

export default async function LotesPage() {
  const supabase = await createClient();

  const [{ data: lotes }, { data: propietarios }] = await Promise.all([
    supabase
      .from("lote")
      .select("id, numero, estado, propietario_id, perfil:propietario_id(nombre)")
      .order("numero"),
    supabase.from("perfil").select("id, nombre").eq("rol", "owner").order("nombre"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Lotes" />
      <LoteForm propietarios={propietarios ?? []} />

      <div className={tableWrapClass}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={theadRowClass}>
              <th className={thClass}>Lote</th>
              <th className={thClass}>Estado</th>
              <th className={thClass}>Propietario</th>
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
                  {l.propietario_id ? (
                    <Link href={`/admin/propietarios/${l.propietario_id}`} className="text-primary hover:underline">
                      {(l.perfil as unknown as { nombre: string } | null)?.nombre ?? "—"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
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
  );
}
