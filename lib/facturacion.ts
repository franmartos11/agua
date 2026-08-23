export type Tramo = { orden: number; desde_m3: number; hasta_m3: number | null; precio_m3: number };
export type ExtraTarifa = { tipo: string; monto: number };
export type Tarifa = {
  cargo_fijo: number;
  cargo_fijo_vacio: number | null;
  recargo_mora_pct: number;
};

export type DetalleCalculo = {
  consumo_m3: number;
  tramos_aplicados: { desde_m3: number; hasta_m3: number | null; m3: number; precio_m3: number; subtotal: number }[];
  monto_consumo: number;
  cargo_fijo: number;
  extras: { tipo: string; monto: number }[];
  monto_extras: number;
  monto_total: number;
};

/** Reparte el consumo entre los tramos progresivos y devuelve el monto por consumo. */
export function calcularConsumo(consumoM3: number, tramos: Tramo[]) {
  const ordenados = [...tramos].sort((a, b) => a.orden - b.orden);
  const aplicados: DetalleCalculo["tramos_aplicados"] = [];
  let restante = consumoM3;
  let total = 0;

  for (const tramo of ordenados) {
    if (restante <= 0) break;
    const techoTramo = tramo.hasta_m3 === null ? Infinity : tramo.hasta_m3 - tramo.desde_m3;
    const m3EnTramo = Math.min(restante, techoTramo);
    if (m3EnTramo <= 0) continue;
    const subtotal = m3EnTramo * tramo.precio_m3;
    aplicados.push({
      desde_m3: tramo.desde_m3,
      hasta_m3: tramo.hasta_m3,
      m3: m3EnTramo,
      precio_m3: tramo.precio_m3,
      subtotal,
    });
    total += subtotal;
    restante -= m3EnTramo;
  }

  return { montoConsumo: total, tramosAplicados: aplicados };
}

export function calcularFactura({
  consumoM3,
  estadoLote,
  extrasVigentes,
  tarifa,
  tramos,
  extrasTarifa,
}: {
  consumoM3: number;
  estadoLote: string;
  extrasVigentes: string[]; // tipos de extra activos en el lote
  tarifa: Tarifa;
  tramos: Tramo[];
  extrasTarifa: ExtraTarifa[];
}): DetalleCalculo {
  const { montoConsumo, tramosAplicados } = calcularConsumo(consumoM3, tramos);

  const cargoFijo =
    estadoLote === "ocupado" ? tarifa.cargo_fijo : (tarifa.cargo_fijo_vacio ?? 0);

  const extrasPorTipo = new Map(extrasTarifa.map((e) => [e.tipo.toLowerCase(), e.monto]));
  const extras = extrasVigentes.map((tipo) => ({
    tipo,
    monto: extrasPorTipo.get(tipo.toLowerCase()) ?? 0,
  }));
  const montoExtras = extras.reduce((acc, e) => acc + e.monto, 0);

  const montoTotal = montoConsumo + cargoFijo + montoExtras;

  return {
    consumo_m3: consumoM3,
    tramos_aplicados: tramosAplicados,
    monto_consumo: montoConsumo,
    cargo_fijo: cargoFijo,
    extras,
    monto_extras: montoExtras,
    monto_total: montoTotal,
  };
}

/** Recargo por mora: se aplica una sola vez sobre el saldo adeudado, no acumulativo. */
export function calcularRecargoMora(saldo: number, recargoPct: number) {
  return Math.round(saldo * (recargoPct / 100) * 100) / 100;
}
