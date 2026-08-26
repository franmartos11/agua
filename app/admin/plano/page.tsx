import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { PlanoEditor, type PlanoTile } from "@/components/plano-editor";
import { InformativoForm } from "./informativo-form";
import type { TipoPlanoInformativo } from "@/lib/actions/planos";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const TABS: { vista: string; label: string }[] = [
  { vista: "barrio", label: "Barrio" },
  { vista: "cloacas", label: "Cloacas" },
  { vista: "red_agua", label: "Red de agua" },
];

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg"];

function tabHref(vista: string) {
  return vista === "barrio" ? "/admin/plano" : `/admin/plano?vista=${vista}`;
}

async function PlanoBarrio() {
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

  if (errorLotes) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        <p className="font-semibold">Falta aplicar una migración en la base de datos.</p>
        <p className="mt-1 text-danger/80">
          Corré esto una vez en el SQL Editor de Supabase y recargá esta página:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-card px-3 py-2 text-xs text-foreground">
          alter table lote add column poligono jsonb;
        </pre>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {periodo
          ? `Estado de pago de ${MESES[periodo.mes - 1]} ${periodo.anio} · click en un lote para ver el detalle`
          : "Todavía no hay períodos de facturación creados"}
      </p>
      <PlanoEditor tiles={tiles} imagenSrc="/planos/los-nosotros.jpg" />
    </>
  );
}

async function PlanoInformativo({ tipo, titulo }: { tipo: TipoPlanoInformativo; titulo: string }) {
  const supabase = await createClient();

  const { data: plano, error } = await supabase
    .from("plano_informativo")
    .select("storage_path, nombre_archivo, updated_at")
    .eq("tipo", tipo)
    .maybeSingle();

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        <p className="font-semibold">Falta aplicar una migración en la base de datos.</p>
        <p className="mt-1 text-danger/80">
          Corré la migración 0009_planos_informativos.sql en el SQL Editor de Supabase y recargá esta página.
        </p>
      </div>
    );
  }

  const ext = plano?.nombre_archivo.split(".").pop()?.toLowerCase() ?? "";
  const esImagen = IMAGE_EXT.includes(ext);
  const url = plano
    ? supabase.storage.from("planos-informativos").getPublicUrl(plano.storage_path).data.publicUrl
    : null;

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Archivo informativo de {titulo.toLowerCase()} del barrio — no tiene lotes ni estados de pago, es solo de
        referencia.
      </p>
      <Card className="flex flex-col gap-4">
        {plano && url ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-foreground">
                <span className="font-medium">{plano.nombre_archivo}</span>
                <span className="text-muted-foreground"> · actualizado {plano.updated_at.slice(0, 10)}</span>
              </p>
              <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                Ver / descargar →
              </a>
            </div>
            {esImagen && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={titulo} className="max-h-[32rem] w-full rounded-lg border border-border object-contain" />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no se subió ningún archivo.</p>
        )}
        <InformativoForm tipo={tipo} />
      </Card>
    </>
  );
}

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const { vista } = await searchParams;
  const vistaActual = TABS.some((t) => t.vista === vista) ? vista! : "barrio";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Plano del barrio" />

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.vista}
            href={tabHref(t.vista)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              vistaActual === t.vista
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {vistaActual === "barrio" && <PlanoBarrio />}
      {vistaActual === "cloacas" && <PlanoInformativo tipo="cloacas" titulo="Cloacas" />}
      {vistaActual === "red_agua" && <PlanoInformativo tipo="red_agua" titulo="Red de agua" />}
    </div>
  );
}
