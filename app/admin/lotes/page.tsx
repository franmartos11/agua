import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerMorosidad } from "@/lib/deuda";
import { PageHeader } from "@/components/ui/page-header";
import { PagoBadge, type PagoEstado } from "@/components/ui/badge";
import { ContactButtons } from "@/components/ui/contact-buttons";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";

export default async function LotesPage({
  searchParams,
}: {
  searchParams: Promise<{ deuda?: string }>;
}) {
  const { deuda } = await searchParams;
  const filtrandoDeuda = deuda === "1";

  const supabase = await createClient();

  const [{ data: todosLosLotes }, morosidad] = await Promise.all([
    supabase
      .from("lote")
      .select("id, numero, estado, propietario_id, perfil:propietario_id(nombre, email, telefono)")
      .order("numero"),
    obtenerMorosidad(supabase),
  ]);

  const lotesConDeudaIds = new Set(morosidad.flatMap((d) => d.loteIds));

  function pagoEstado(loteId: string, propietarioId: string | null): PagoEstado {
    if (!propietarioId) return "sin-propietario";
    return lotesConDeudaIds.has(loteId) ? "con-deuda" : "al-dia";
  }

  let lotes = todosLosLotes ?? [];

  if (filtrandoDeuda) {
    lotes = lotes.filter((l) => lotesConDeudaIds.has(l.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={filtrandoDeuda ? "Lotes con deuda" : "Lotes"}
        subtitle={
          filtrandoDeuda ? (
            <>
              Mostrando solo lotes con facturas impagas.{" "}
              <Link href="/admin/lotes" className="text-primary hover:underline">
                Ver todos
              </Link>
            </>
          ) : (
            <>
              Para dar de alta o editar un lote, andá a{" "}
              <Link href="/admin/configuracion" className="text-primary hover:underline">
                Configuración
              </Link>
              .
            </>
          )
        }
      />

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
            {lotes.map((l) => {
              const propietario = l.perfil as unknown as {
                nombre: string;
                email: string | null;
                telefono: string | null;
              } | null;
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
                        {propietario?.nombre ?? "—"}
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
            {lotes.length === 0 && (
              <tr>
                <td colSpan={4} className={emptyTdClass}>
                  {filtrandoDeuda ? "Ningún lote tiene deuda pendiente 🎉" : "Todavía no hay lotes cargados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
