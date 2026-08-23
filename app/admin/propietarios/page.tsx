import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerMorosidad } from "@/lib/deuda";
import { PageHeader } from "@/components/ui/page-header";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";
import { InviteForm } from "./invite-form";

export default async function PropietariosPage() {
  const supabase = await createClient();
  const [{ data: propietarios }, morosidad] = await Promise.all([
    supabase.from("perfil").select("id, nombre, email, telefono").eq("rol", "owner").order("nombre"),
    obtenerMorosidad(supabase),
  ]);

  const saldoPorPropietario = new Map(morosidad.map((d) => [d.propietarioId, d.saldo]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Propietarios" subtitle="Personas dueñas de un lote en el barrio" />
      <InviteForm />

      <div className={tableWrapClass}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={theadRowClass}>
              <th className={thClass}>Nombre</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Teléfono</th>
              <th className={thClass}>Saldo pendiente</th>
            </tr>
          </thead>
          <tbody>
            {propietarios?.map((p) => {
              const saldo = saldoPorPropietario.get(p.id);
              return (
                <tr key={p.id} className={trClass}>
                  <td className={tdClass}>
                    <Link href={`/admin/propietarios/${p.id}`} className="font-medium text-primary hover:underline">
                      {p.nombre}
                    </Link>
                  </td>
                  <td className={tdClass}>{p.email}</td>
                  <td className={tdClass}>{p.telefono ?? "—"}</td>
                  <td className={tdClass}>
                    {saldo ? (
                      <span className="font-medium text-danger">${saldo.toFixed(2)}</span>
                    ) : (
                      <span className="text-success">Al día</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {propietarios?.length === 0 && (
              <tr>
                <td colSpan={4} className={emptyTdClass}>
                  Todavía no hay propietarios cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
