import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarLote, eliminarLote } from "@/lib/actions/lotes";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EditLoteForm } from "./edit-form";

export default async function ConfiguracionLoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lote }, { data: propietarios }] = await Promise.all([
    supabase.from("lote").select("*").eq("id", id).single(),
    supabase.from("perfil").select("id, nombre").eq("rol", "owner").order("nombre"),
  ]);

  if (!lote) notFound();

  const updateAction = actualizarLote.bind(null, id);
  const deleteAction = eliminarLote.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Editar lote ${lote.numero}`}
        subtitle={
          <Link href={`/admin/lotes/${id}`} className="text-primary hover:underline">
            ← Ver lote
          </Link>
        }
      />

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Datos</h2>
        <EditLoteForm action={updateAction} lote={lote} propietarios={propietarios ?? []} />
      </Card>

      <form action={deleteAction}>
        <ConfirmSubmitButton
          label="Eliminar lote"
          confirmText={`¿Eliminar el lote ${lote.numero}? Se pierden sus extras y medidores asociados.`}
        />
      </form>
    </div>
  );
}
