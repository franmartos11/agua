import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { PlanoEditor, type PlanoTile } from "@/components/plano-editor";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function PlanoPage() {
  const supabase = await createClient();

  const [{ data: lotes, error: errorLotes }, { data: periodo }] = await Promise.all([
    supabase
      .from("lote")
      .select("id, numero, poligono, perfil:propietario_id(nombre)")
      .order("numero"),
    supabase
      .from("periodo_facturacion")
      .select("id, mes, anio")
      .order("anio", { ascending: false })
      .order("mes", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: facturas } = periodo
    ? await supabase
        .from("factura")
        .select("lote_id, estado, monto_total, monto_pagado")
        .eq("periodo_id", periodo.id)
    : { data: [] };

  const facturaPorLote = new Map((facturas ?? []).map((f) => [f.lote_id, f]));

  const tiles: PlanoTile[] = (lotes ?? []).map((l) => {
    const propietario = l.perfil as unknown as { nombre: string } | null;
    const factura = facturaPorLote.get(l.id);
    return {
      id: l.id,
      numero: l.numero,
      propietarioNombre: propietario?.nombre ?? null,
      estadoFactura: factura?.estado ?? null,
      saldo: factura ? Number(factura.monto_total) - Number(factura.monto_pagado) : 0,
      poligono: l.poligono as { x: number; y: number }[] | null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Plano del barrio"
        subtitle={
          periodo
            ? `Estado de pago de ${MESES[periodo.mes - 1]} ${periodo.anio} · click en un lote para ver el detalle`
            : "Todavía no hay períodos de facturación creados"
        }
      />
      {errorLotes ? (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
          <p className="font-semibold">Falta aplicar una migración en la base de datos.</p>
          <p className="mt-1 text-danger/80">
            Corré esto una vez en el SQL Editor de Supabase y recargá esta página:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-card px-3 py-2 text-xs text-foreground">
            alter table lote add column poligono jsonb;
          </pre>
        </div>
      ) : (
        <PlanoEditor tiles={tiles} imagenSrc="/planos/los-nosotros.jpg" />
      )}
    </div>
  );
}
