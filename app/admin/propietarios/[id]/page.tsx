import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarPropietario, eliminarPropietario } from "@/lib/actions/propietarios";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { EditPropietarioForm } from "./edit-form";

export default async function PropietarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: propietario } = await supabase
    .from("perfil")
    .select("id, nombre, email, telefono")
    .eq("id", id)
    .eq("rol", "owner")
    .single();

  if (!propietario) notFound();

  const { data: lotes } = await supabase
    .from("lote")
    .select("id, numero, estado")
    .eq("propietario_id", id)
    .order("numero");

  const updateAction = actualizarPropietario.bind(null, id);
  const deleteAction = eliminarPropietario.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={propietario.nombre} subtitle={propietario.email} />

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Datos</h2>
        <EditPropietarioForm
          action={updateAction}
          nombre={propietario.nombre}
          telefono={propietario.telefono}
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Lotes</h2>
        {lotes && lotes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {lotes.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <Link href={`/admin/lotes/${l.id}`} className="font-medium text-primary hover:underline">
                  Lote {l.numero}
                </Link>
                <EstadoBadge estado={l.estado} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tiene lotes asignados todavía.</p>
        )}
      </Card>

      <form action={deleteAction}>
        <ConfirmSubmitButton
          label="Eliminar propietario"
          confirmText={`¿Eliminar a ${propietario.nombre}? Esto borra su acceso al sistema. Sus lotes quedan sin propietario asignado.`}
        />
      </form>
    </div>
  );
}
