const MESES_ABR = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

type PuntoConsumo = { mes: number; anio: number; consumo_m3: number };

export function ConsumoChart({ datos }: { datos: PuntoConsumo[] }) {
  if (datos.length < 2) return null;

  const max = Math.max(...datos.map((d) => d.consumo_m3), 1);
  const ALTO_BARRAS = 80; // px

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Consumo reciente</h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-end gap-2 sm:gap-3">
          {datos.map((d, i) => {
            const alto = Math.round(Math.max(d.consumo_m3 / max, 0.04) * ALTO_BARRAS);
            const esUltimo = i === datos.length - 1;
            return (
              <div key={`${d.anio}-${d.mes}`} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {d.consumo_m3}m³
                </span>
                <div
                  title={`${MESES_ABR[d.mes - 1]} ${d.anio}: ${d.consumo_m3} m³`}
                  className={`w-full rounded-t-md transition-all ${esUltimo ? "bg-primary" : "bg-primary/40"}`}
                  style={{ height: `${alto}px` }}
                />
                <span className="text-[11px] text-muted-foreground">{MESES_ABR[d.mes - 1]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
