"use client";

import Link from "next/link";
import { EstadoBadge } from "@/components/ui/badge";

type EstadoFactura = "pendiente" | "parcial" | "vencida" | "pagada";

type FacturaCardProps = {
  id: string;
  mes: number;
  anio: number;
  estado: EstadoFactura;
  monto_total: number;
  monto_pagado: number;
  vencimiento: string;
  loteNumero: string | null;
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatPeso(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function diasHastaVencimiento(vencimiento: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(vencimiento + "T00:00:00");
  return Math.round((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function FacturaCard({
  id,
  mes,
  anio,
  estado,
  monto_total,
  monto_pagado,
  vencimiento,
  loteNumero,
}: FacturaCardProps) {
  const saldo = monto_total - monto_pagado;
  const isPagada = estado === "pagada";
  const isVencida = estado === "vencida";
  const dias = !isPagada ? diasHastaVencimiento(vencimiento) : null;

  // Color del borde lateral por urgencia
  const borderColor = isPagada
    ? "border-l-success"
    : isVencida
      ? "border-l-danger"
      : dias !== null && dias <= 5
        ? "border-l-danger"
        : "border-l-warning";

  // Texto de urgencia de vencimiento
  const vencimientoLabel = isPagada
    ? null
    : isVencida
      ? "⚠ Vencida"
      : dias === 0
        ? "⚠ Vence hoy"
        : dias === 1
          ? "Vence mañana"
          : dias !== null && dias <= 5
            ? `Vence en ${dias} días`
            : `Vence ${new Date(vencimiento + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`;

  const urgente = !isPagada && (isVencida || (dias !== null && dias <= 5));

  return (
    <div
      className={`rounded-xl border border-border bg-card border-l-4 ${borderColor} shadow-sm transition-all hover:shadow-md`}
    >
      {/* Cuerpo de la card */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-foreground">
              {MESES[mes - 1]} {anio}
            </p>
            {loteNumero && (
              <p className="text-xs text-muted-foreground mt-0.5">Lote {loteNumero}</p>
            )}
          </div>
          <EstadoBadge estado={estado} />
        </div>

        {/* Monto */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {!isPagada && saldo > 0 && (
              <p className={`text-2xl font-bold ${urgente ? "text-danger" : "text-foreground"}`}>
                {formatPeso(saldo)}
              </p>
            )}
            {isPagada && (
              <p className="text-lg font-semibold text-success">
                {formatPeso(monto_total)}
              </p>
            )}
            {monto_pagado > 0 && !isPagada && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Parcial: {formatPeso(monto_pagado)} pagado
              </p>
            )}
          </div>

          {/* Etiqueta de vencimiento */}
          {vencimientoLabel && (
            <span
              className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                urgente
                  ? "bg-danger-soft text-danger"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {vencimientoLabel}
            </span>
          )}
          {isPagada && (
            <span className="text-xs text-muted-foreground">✓ Pagada</span>
          )}
        </div>

        {/* Barra de progreso */}
        {monto_total > 0 && (
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isPagada ? "bg-success" : urgente ? "bg-danger" : "bg-primary"}`}
              style={{ width: `${Math.min((monto_pagado / monto_total) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Footer con botones de acción */}
      <div className={`border-t border-border px-4 py-3 flex items-center gap-2 ${isPagada ? "justify-end" : "justify-between"}`}>
        {/* Botón principal: Pagar */}
        {!isPagada && (
          <Link
            href={`/propietario/facturas/${id}#pagar`}
            className={`flex-1 text-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
              urgente
                ? "bg-danger text-white hover:bg-danger/90 shadow-sm shadow-danger/30"
                : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm shadow-primary/20"
            }`}
          >
            {estado === "parcial" ? "Completar pago" : "Pagar ahora"}
          </Link>
        )}
        {/* Ver detalle */}
        <Link
          href={`/propietario/facturas/${id}`}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {isPagada ? "Ver detalle →" : "Ver detalle"}
        </Link>
      </div>
    </div>
  );
}
