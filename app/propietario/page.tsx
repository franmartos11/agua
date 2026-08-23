import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function PropietarioDashboardPage() {
  const supabase = await createClient();

  // RLS ya limita todo esto a los lotes/facturas del usuario logueado.
  const [{ data: lotes }, { data: facturas }] = await Promise.all([
    supabase.from("lote").select("id, numero, estado"),
    supabase.from("factura").select("monto_total, monto_pagado, estado").in("estado", ["pendiente", "parcial", "vencida"]),
  ]);

  const saldoTotal = (facturas ?? []).reduce(
    (acc, f) => acc + (Number(f.monto_total) - Number(f.monto_pagado)),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inicio" />

      <Card className={saldoTotal > 0 ? "border-warning/30 bg-warning-soft" : "border-success/30 bg-success-soft"}>
        {saldoTotal > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Saldo pendiente</p>
              <p className="text-2xl font-semibold text-warning">${saldoTotal.toFixed(2)}</p>
            </div>
            <Link href="/propietario/facturas">
              <Button size="sm">Ver facturas</Button>
            </Link>
          </div>
        ) : (
          <p className="font-medium text-success">Estás al día con tus pagos ✓</p>
        )}
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Mis lotes</h2>
        <div className="flex flex-col gap-2">
          {lotes?.map((l) => (
            <Card key={l.id} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">Lote {l.numero}</span>
              <EstadoBadge estado={l.estado} />
            </Card>
          ))}
          {lotes?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no tenés lotes asignados.
            </p>
          )}
        </div>
      </div>

      <Link href="/propietario/facturas" className="w-fit text-sm font-medium text-primary hover:underline">
        Ver todas mis facturas →
      </Link>
    </div>
  );
}
