import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { TarifaForm } from "./tarifa-form";

export default async function TarifasPage() {
  const supabase = await createClient();
  const { data: tarifas } = await supabase
    .from("tarifa")
    .select("id, vigente_desde, cargo_fijo, cargo_fijo_vacio, tarifa_tramo(orden, desde_m3, hasta_m3, precio_m3), tarifa_extra(tipo, monto)")
    .order("vigente_desde", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tarifas"
        subtitle={
          <>
            Cada tarifa nueva reemplaza a la anterior desde su fecha de vigencia. Las tarifas viejas no se editan —
            así las facturas ya emitidas no cambian. El recargo por mora se configura en{" "}
            <Link href="/admin/configuracion" className="text-primary hover:underline">
              Configuración
            </Link>
            .
          </>
        }
      />

      <TarifaForm />

      <div className="flex flex-col gap-4">
        {tarifas?.map((t) => (
          <Card key={t.id} className="text-sm">
            <p className="font-medium text-foreground">Vigente desde {t.vigente_desde}</p>
            <p className="mt-1 text-muted-foreground">
              Cargo fijo: ${t.cargo_fijo} · Vacío/construcción: {t.cargo_fijo_vacio ?? "no cobra"}
            </p>
            <div className="mt-3">
              <p className="font-medium text-foreground">Tramos</p>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {t.tarifa_tramo
                  ?.sort((a, b) => a.orden - b.orden)
                  .map((tr) => (
                    <li key={tr.orden}>
                      {tr.desde_m3} a {tr.hasta_m3 ?? "∞"} m³: ${tr.precio_m3}/m³
                    </li>
                  ))}
              </ul>
            </div>
            {t.tarifa_extra && t.tarifa_extra.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-foreground">Extras</p>
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {t.tarifa_extra.map((e) => (
                    <li key={e.tipo}>
                      {e.tipo}: ${e.monto}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
        {tarifas?.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay tarifas cargadas.</p>
        )}
      </div>
    </div>
  );
}
