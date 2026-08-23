type Tramo = { desde_m3: number; hasta_m3: number | null; m3: number; precio_m3: number; subtotal: number };
type Extra = { tipo: string; monto: number };

export type DetalleFactura = {
  consumo_m3?: number;
  tramos_aplicados?: Tramo[];
  monto_consumo?: number;
  cargo_fijo?: number;
  extras?: Extra[];
  monto_extras?: number;
  monto_total?: number;
  sin_lectura_base?: boolean;
  recargo_mora?: number;
};

export function FacturaDetalle({ detalle }: { detalle: DetalleFactura }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      {detalle.sin_lectura_base && (
        <p className="mb-1 rounded-lg bg-warning-soft px-3 py-2 text-warning">
          Sin lectura anterior disponible: el consumo de algún medidor se tomó como 0. Revisar.
        </p>
      )}
      {detalle.tramos_aplicados?.map((t, i) => (
        <p key={i} className="flex justify-between text-muted-foreground">
          <span>
            Consumo {t.desde_m3}–{t.hasta_m3 ?? "∞"} m³: {t.m3} m³ × ${t.precio_m3}
          </span>
          <span>${t.subtotal.toFixed(2)}</span>
        </p>
      ))}
      <p className="flex justify-between font-medium text-foreground">
        <span>Subtotal consumo ({detalle.consumo_m3} m³)</span>
        <span>${detalle.monto_consumo?.toFixed(2)}</span>
      </p>
      <p className="flex justify-between text-muted-foreground">
        <span>Cargo fijo</span>
        <span>${detalle.cargo_fijo?.toFixed(2)}</span>
      </p>
      {detalle.extras?.map((e, i) => (
        <p key={i} className="flex justify-between text-muted-foreground">
          <span>{e.tipo}</span>
          <span>${e.monto.toFixed(2)}</span>
        </p>
      ))}
      {detalle.recargo_mora !== undefined && detalle.recargo_mora > 0 && (
        <p className="flex justify-between text-danger">
          <span>Recargo por mora</span>
          <span>${detalle.recargo_mora.toFixed(2)}</span>
        </p>
      )}
      <p className="mt-1 flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
        <span>Total</span>
        <span>${((detalle.monto_total ?? 0) + (detalle.recargo_mora ?? 0)).toFixed(2)}</span>
      </p>
    </div>
  );
}
