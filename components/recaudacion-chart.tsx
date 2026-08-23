type PuntoRecaudacion = { periodo: string; monto: number };

export function RecaudacionChart({ datos }: { datos: PuntoRecaudacion[] }) {
  if (datos.length < 2) return null;

  const max = Math.max(...datos.map((d) => d.monto), 1);
  const ALTO_BARRAS = 96; // px

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-3">
      <div className="flex items-end gap-2 sm:gap-3">
        {datos.map((d, i) => {
          const alto = Math.round(Math.max(d.monto / max, 0.04) * ALTO_BARRAS);
          const esUltimo = i === datos.length - 1;
          return (
            <div key={d.periodo} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                ${Math.round(d.monto).toLocaleString("es-AR")}
              </span>
              <div
                title={`${d.periodo}: $${d.monto.toFixed(2)}`}
                className={`w-full rounded-t-md transition-all ${esUltimo ? "bg-primary" : "bg-primary/40"}`}
                style={{ height: `${alto}px` }}
              />
              <span className="text-[11px] text-muted-foreground">{d.periodo}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
