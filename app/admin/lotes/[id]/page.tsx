import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  agregarPileta,
  quitarExtra,
  agregarMedidor,
  alternarMedidor,
} from "@/lib/actions/lotes";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, EstadoBadge } from "@/components/ui/badge";
import { tableWrapClass, theadRowClass, thClass, tdClass, trClass, emptyTdClass } from "@/components/ui/table";
import { MedidorForm } from "./medidor-form";

export default async function LoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lote }, { data: extras }, { data: medidores }, { data: facturas }] =
    await Promise.all([
      supabase
        .from("lote")
        .select("*, perfil:propietario_id(nombre)")
        .eq("id", id)
        .single(),
      supabase
        .from("extra")
        .select("id, tipo, vigente_desde, vigente_hasta")
        .eq("lote_id", id)
        .is("vigente_hasta", null)
        .order("tipo"),
      supabase
        .from("medidor")
        .select("id, numero_serie, tipo, fecha_instalacion, activo")
        .eq("lote_id", id)
        .order("numero_serie"),
      supabase
        .from("factura")
        .select("id, mes, anio, estado, monto_total, monto_pagado, vencimiento")
        .eq("lote_id", id)
        .order("anio", { ascending: false })
        .order("mes", { ascending: false }),
    ]);

  if (!lote) notFound();

  const saldoTotal = (facturas ?? []).reduce(
    (acc, f) => (f.estado === "pagada" ? acc : acc + (Number(f.monto_total) - Number(f.monto_pagado))),
    0,
  );

  const propietario = lote.perfil as unknown as { nombre: string } | null;
  const tienePileta = extras?.some((e) => e.tipo.toLowerCase() === "pileta");
  const addMedidorAction = agregarMedidor.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Lote ${lote.numero}`}
        actions={
          lote.propietario_id ? (
            <Link href={`/admin/pagos?propietario=${lote.propietario_id}`}>
              <Button size="sm">Cobrar</Button>
            </Link>
          ) : undefined
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
          <p className="text-xs font-medium text-muted-foreground">Facturas emitidas</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{facturas?.length ?? 0}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">Datos</h2>
          <Link href={`/admin/configuracion/lotes/${id}`} className="text-sm text-primary hover:underline">
            Editar →
          </Link>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Dirección</dt>
            <dd className="text-foreground">{lote.direccion ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Superficie</dt>
            <dd className="text-foreground">{lote.superficie_m2 ? `${lote.superficie_m2} m²` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Estado</dt>
            <dd>
              <EstadoBadge estado={lote.estado} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Propietario</dt>
            <dd className="text-foreground">{propietario?.nombre ?? "Sin asignar"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Pileta (único extra que afecta el cobro)</h2>
        <div className="flex flex-wrap items-center gap-2">
          {extras?.map((e) => (
            <span
              key={e.id}
              className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-foreground"
            >
              {e.tipo}
              <form action={quitarExtra.bind(null, e.id, id)}>
                <button type="submit" className="text-muted-foreground hover:text-danger" aria-label="Quitar">
                  ×
                </button>
              </form>
            </span>
          ))}
          {!tienePileta && (
            <form action={agregarPileta.bind(null, id)}>
              <Button type="submit" variant="secondary" size="sm">
                + Agregar pileta
              </Button>
            </form>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Medidores</h2>
        <div className={`mb-3 ${tableWrapClass}`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>N° serie</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {medidores?.map((m) => (
                <tr key={m.id} className={trClass}>
                  <td className={tdClass}>{m.numero_serie}</td>
                  <td className={`${tdClass} capitalize`}>{m.tipo}</td>
                  <td className={tdClass}>
                    <Badge variant={m.activo ? "success" : "neutral"}>
                      {m.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className={`${tdClass} flex gap-3`}>
                    <Link href={`/admin/medidores/${m.id}`} className="text-primary hover:underline">
                      Lecturas
                    </Link>
                    <form action={alternarMedidor.bind(null, m.id, id, m.activo)}>
                      <button type="submit" className="text-muted-foreground hover:text-foreground hover:underline">
                        {m.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {medidores?.length === 0 && (
                <tr>
                  <td colSpan={4} className={emptyTdClass}>
                    Sin medidores cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <MedidorForm action={addMedidorAction} />
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Historial de facturas</h2>
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Período</th>
                <th className={thClass}>Vencimiento</th>
                <th className={thClass}>Total</th>
                <th className={thClass}>Saldo</th>
                <th className={thClass}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {facturas?.map((f) => {
                const saldo = Number(f.monto_total) - Number(f.monto_pagado);
                return (
                  <tr key={f.id} className={trClass}>
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
              {facturas?.length === 0 && (
                <tr>
                  <td colSpan={5} className={emptyTdClass}>
                    Todavía no tiene facturas emitidas.
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
