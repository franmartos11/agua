import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarPropietario, eliminarPropietario } from "@/lib/actions/propietarios";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";
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

  const loteIds = (lotes ?? []).map((l) => l.id);
  const { data: facturas } = loteIds.length
    ? await supabase
        .from("factura")
        .select("id, mes, anio, estado, monto_total, monto_pagado, vencimiento, lote:lote_id(numero)")
        .in("lote_id", loteIds)
        .order("anio", { ascending: false })
        .order("mes", { ascending: false })
    : { data: [] };

  type FacturaLote = { numero: string } | null;
  const todasLasFacturas = (facturas ?? []).map((f) => ({ ...f, lote: f.lote as unknown as FacturaLote }));
  const saldoTotal = todasLasFacturas.reduce(
    (acc, f) => (f.estado === "pagada" ? acc : acc + (Number(f.monto_total) - Number(f.monto_pagado))),
    0,
  );

  const updateAction = actualizarPropietario.bind(null, id);
  const deleteAction = eliminarPropietario.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={propietario.nombre}
        subtitle={propietario.email}
        actions={
          <Link href={`/admin/pagos?propietario=${id}`}>
            <Button size="sm">Cobrar</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[10rem]">
          <p className="text-xs font-medium text-muted-foreground">Saldo pendiente</p>
          <p className={`mt-1 text-2xl font-semibold ${saldoTotal > 0 ? "text-danger" : "text-success"}`}>
            ${saldoTotal.toFixed(2)}
          </p>
        </Card>
        <Card className="flex-1 min-w-[10rem]">
          <p className="text-xs font-medium text-muted-foreground">Lotes</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{lotes?.length ?? 0}</p>
        </Card>
        <Card className="flex-1 min-w-[10rem]">
          <p className="text-xs font-medium text-muted-foreground">Facturas emitidas</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{todasLasFacturas.length}</p>
        </Card>
      </div>

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

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Historial de facturas</h2>
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Lote</th>
                <th className={thClass}>Período</th>
                <th className={thClass}>Vencimiento</th>
                <th className={thClass}>Total</th>
                <th className={thClass}>Saldo</th>
                <th className={thClass}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {todasLasFacturas.map((f) => {
                const saldo = Number(f.monto_total) - Number(f.monto_pagado);
                return (
                  <tr key={f.id} className={trClass}>
                    <td className={tdClass}>{f.lote?.numero ?? "—"}</td>
                    <td className={tdClass}>
                      <Link href={`/admin/facturas/${f.id}`} className="font-medium text-primary hover:underline">
                        {f.mes}/{f.anio}
                      </Link>
                    </td>
                    <td className={tdClass}>{f.vencimiento}</td>
                    <td className={tdClass}>${Number(f.monto_total).toFixed(2)}</td>
                    <td className={tdClass}>${saldo.toFixed(2)}</td>
                    <td className={tdClass}>
                      <EstadoBadge estado={f.estado} />
                    </td>
                  </tr>
                );
              })}
              {todasLasFacturas.length === 0 && (
                <tr>
                  <td colSpan={6} className={emptyTdClass}>
                    Todavía no tiene facturas emitidas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form action={deleteAction}>
        <ConfirmSubmitButton
          label="Eliminar propietario"
          confirmText={`¿Eliminar a ${propietario.nombre}? Esto borra su acceso al sistema. Sus lotes quedan sin propietario asignado.`}
        />
      </form>
    </div>
  );
}
