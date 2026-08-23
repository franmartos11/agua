import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { agregarLectura } from "@/lib/actions/lecturas";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";
import { LecturaForm } from "./lectura-form";

export default async function MedidorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: medidor } = await supabase
    .from("medidor")
    .select("id, numero_serie, tipo, activo, lote:lote_id(id, numero)")
    .eq("id", id)
    .single();

  if (!medidor) notFound();

  const { data: lecturas } = await supabase
    .from("lectura")
    .select("id, valor, fecha, fuente, cargado_por:cargado_por(nombre)")
    .eq("medidor_id", id)
    .order("fecha", { ascending: false });

  const lote = medidor.lote as unknown as { id: string; numero: string } | null;
  const addAction = agregarLectura.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Medidor ${medidor.numero_serie}`}
        subtitle={
          <>
            <span className="capitalize">{medidor.tipo}</span>
            {lote && (
              <>
                {" · "}
                <Link href={`/admin/lotes/${lote.id}`} className="text-primary hover:underline">
                  Lote {lote.numero}
                </Link>
              </>
            )}
          </>
        }
      />

      <LecturaForm action={addAction} />

      <div className={tableWrapClass}>
        <table className="w-full max-w-lg text-left text-sm">
          <thead>
            <tr className={theadRowClass}>
              <th className={thClass}>Fecha</th>
              <th className={thClass}>Valor (m³)</th>
              <th className={thClass}>Origen</th>
              <th className={thClass}>Cargado por</th>
            </tr>
          </thead>
          <tbody>
            {lecturas?.map((l) => {
              const cargadoPor = l.cargado_por as unknown as { nombre: string } | null;
              return (
                <tr key={l.id} className={trClass}>
                  <td className={tdClass}>{l.fecha}</td>
                  <td className={tdClass}>{l.valor}</td>
                  <td className={tdClass}>
                    <Badge variant={l.fuente === "manual" ? "neutral" : "info"}>{l.fuente}</Badge>
                  </td>
                  <td className={tdClass}>{cargadoPor?.nombre ?? "—"}</td>
                </tr>
              );
            })}
            {lecturas?.length === 0 && (
              <tr>
                <td colSpan={4} className={emptyTdClass}>
                  Sin lecturas cargadas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
