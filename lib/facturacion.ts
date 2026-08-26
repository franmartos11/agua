export type Tramo = { orden: number; desde_m3: number; hasta_m3: number | null; precio_m3: number };
export type ExtraTarifa = { tipo: string; monto: number };
export type Tarifa = {
  cargo_fijo: number;
  cargo_fijo_vacio: number | null;
};

export type BoletaEpas = { m3: number; monto: number };

export type DetalleCalculo = {
  consumo_m3: number;
  tramos_aplicados: { desde_m3: number; hasta_m3: number | null; m3: number; precio_m3: number; subtotal: number }[];
  monto_consumo: number;
  cargo_fijo: number;
  extras: { tipo: string; monto: number }[];
  monto_extras: number;
  monto_total: number;
  /** Presente cuando el consumo se cobró a precio único, repartiendo la boleta EPAS del complejo (regla de tres simple) en vez de por tramos. */
  epas?: { m3_complejo: number; monto_complejo: number; precio_m3: number };
};

/**
 * Reparte la boleta EPAS del complejo entre los lotes por regla de tres simple:
 * precio_m3 = monto pagado a EPAS / m³ totales del macromedidor. Cada lote paga
 * su propio consumo a ese precio único (no hay tramos progresivos acá).
 */
export function calcularConsumoProporcional(consumoM3: number, epas: BoletaEpas) {
  const precioM3 = epas.m3 > 0 ? epas.monto / epas.m3 : 0;
  const subtotal = Math.round(consumoM3 * precioM3 * 100) / 100;
  return {
    montoConsumo: subtotal,
    tramosAplicados: [
      { desde_m3: 0, hasta_m3: null, m3: consumoM3, precio_m3: Math.round(precioM3 * 100) / 100, subtotal },
    ] as DetalleCalculo["tramos_aplicados"],
    precioM3: Math.round(precioM3 * 100) / 100,
  };
}

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
  epas,
}: {
  consumoM3: number;
  estadoLote: string;
  extrasVigentes: string[]; // tipos de extra activos en el lote
  tarifa: Tarifa;
  tramos: Tramo[];
  extrasTarifa: ExtraTarifa[];
  /** Si viene con m3 > 0, el consumo se cobra repartiendo la boleta EPAS del complejo en vez de usar tramos. */
  epas?: BoletaEpas | null;
}): DetalleCalculo {
  const usaEpas = !!epas && epas.m3 > 0;
  const { montoConsumo, tramosAplicados, precioM3 } = usaEpas
    ? calcularConsumoProporcional(consumoM3, epas!)
    : { ...calcularConsumo(consumoM3, tramos), precioM3: undefined };

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
    ...(usaEpas && precioM3 !== undefined
      ? { epas: { m3_complejo: epas!.m3, monto_complejo: epas!.monto, precio_m3: precioM3 } }
      : {}),
  };
}

export type ReglaMora = { dias_desde: number; recargo_pct: number };

/**
 * Recargo por mora según tramos de días de atraso (0 días = vence hoy, no es
 * mora todavía). Se calcula siempre sobre el monto base de la factura (sin
 * mora previa) para que no se acumule recargo sobre recargo al recalcular
 * día a día — cada corrida reemplaza el recargo anterior por el que
 * corresponde al tramo vigente hoy.
 */
export function calcularRecargoMoraTramos(base: number, diasAtraso: number, reglas: ReglaMora[]) {
  const tramoAplicable = [...reglas]
    .filter((r) => r.dias_desde <= diasAtraso)
    .sort((a, b) => b.dias_desde - a.dias_desde)[0];

  const pct = tramoAplicable?.recargo_pct ?? 0;
  const recargo = Math.round(base * (pct / 100) * 100) / 100;
  return { recargo, pct };
}
