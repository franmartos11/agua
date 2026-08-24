"use client";

import { useMemo, useRef, useState } from "react";
import { guardarPoligono, borrarPoligono } from "@/lib/actions/lotes";

export type PlanoTile = {
  id: string;
  numero: string;
  propietarioNombre: string | null;
  estadoFactura: string | null;
  saldo: number;
  poligono: { x: number; y: number }[] | null;
};

const FILL: Record<string, string> = {
  pagada: "var(--success)",
  pendiente: "var(--warning)",
  parcial: "var(--primary)",
  vencida: "var(--danger)",
  sin_facturar: "var(--muted-foreground)",
};

const IMG_W = 2194;
const IMG_H = 1920;

function centroide(puntos: { x: number; y: number }[]) {
  const n = puntos.length;
  const x = puntos.reduce((a, p) => a + p.x, 0) / n;
  const y = puntos.reduce((a, p) => a + p.y, 0) / n;
  return { x, y };
}

export function PlanoEditor({ tiles, imagenSrc }: { tiles: PlanoTile[]; imagenSrc: string }) {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loteId, setLoteId] = useState("");
  const [puntos, setPuntos] = useState<{ x: number; y: number }[]>([]);
  const [guardando, setGuardando] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const posicionados = tiles.filter((t) => t.poligono && t.poligono.length >= 3);
  const sinPosicionar = tiles
    .filter((t) => !t.poligono || t.poligono.length < 3)
    .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));

  const dibujando = modoEdicion && loteId;

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!dibujando || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPuntos((prev) => [...prev, { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }]);
  }

  async function handleGuardar() {
    if (!loteId || puntos.length < 3) return;
    setGuardando(true);
    try {
      await guardarPoligono(loteId, puntos);
      setPuntos([]);
      setLoteId("");
    } finally {
      setGuardando(false);
    }
  }

  function handleCancelar() {
    setPuntos([]);
    setLoteId("");
  }

  async function handleBorrar(id: string) {
    await borrarPoligono(id);
  }

  const puntosSvg = useMemo(() => puntos.map((p) => `${p.x},${p.y}`).join(" "), [puntos]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {Object.entries({
            pagada: "Pagado",
            pendiente: "Pendiente",
            parcial: "Parcial",
            vencida: "Vencido",
            sin_facturar: "Sin facturar",
          }).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-3 w-3 rounded-sm" style={{ background: FILL[key] }} />
              {label}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setModoEdicion((v) => !v);
            handleCancelar();
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            modoEdicion
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          {modoEdicion ? "Salir de edición" : "Delimitar lotes"}
        </button>
      </div>

      {modoEdicion && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3">
          <select
            value={loteId}
            onChange={(e) => {
              setLoteId(e.target.value);
              setPuntos([]);
            }}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="">Elegí un lote sin delimitar…</option>
            {sinPosicionar.map((t) => (
              <option key={t.id} value={t.id}>
                Lote {t.numero}
              </option>
            ))}
          </select>
          {loteId && (
            <>
              <span className="text-xs text-primary">
                Click sobre el plano para marcar cada esquina ({puntos.length} punto{puntos.length === 1 ? "" : "s"})
              </span>
              <button
                type="button"
                onClick={() => setPuntos((p) => p.slice(0, -1))}
                disabled={puntos.length === 0}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-40"
              >
                Deshacer punto
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={puntos.length < 3 || guardando}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
              >
                {guardando ? "Guardando…" : "Cerrar polígono y guardar"}
              </button>
              <button type="button" onClick={handleCancelar} className="text-xs text-muted-foreground hover:underline">
                Cancelar
              </button>
            </>
          )}
          {sinPosicionar.length === 0 && !loteId && (
            <span className="text-xs text-primary">Ya delimitaste todos los lotes cargados.</span>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-card" style={{ aspectRatio: `${IMG_W}/${IMG_H}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagenSrc} alt="Plano del barrio" className="absolute inset-0 h-full w-full object-contain select-none" draggable={false} />
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onClick={handleClick}
          className={`absolute inset-0 h-full w-full ${dibujando ? "cursor-crosshair" : ""}`}
        >
          {posicionados.map((t) => {
            const puntosStr = t.poligono!.map((p) => `${p.x},${p.y}`).join(" ");
            const c = centroide(t.poligono!);
            const color = FILL[t.estadoFactura ?? "sin_facturar"];
            const tituloEdicion = `Lote ${t.numero} — click para borrar el polígono`;
            const tituloVista = `Lote ${t.numero} · ${t.propietarioNombre ?? "Sin propietario"}${
              t.saldo > 0 ? ` · $${t.saldo.toFixed(2)}` : ""
            }`;
            const contenido = (
              <>
                <polygon
                  points={puntosStr}
                  fill={color}
                  fillOpacity={0.6}
                  stroke={color}
                  strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  fontSize={1.6}
                  fontWeight={700}
                  fill="var(--foreground)"
                  stroke="var(--card)"
                  strokeWidth={0.35}
                  paintOrder="stroke"
                >
                  {t.numero}
                </text>
              </>
            );
            return modoEdicion ? (
              <g key={t.id} onClick={() => handleBorrar(t.id)} className="cursor-pointer">
                <title>{tituloEdicion}</title>
                {contenido}
              </g>
            ) : (
              <a key={t.id} href={`/admin/lotes/${t.id}`} className="cursor-pointer">
                <title>{tituloVista}</title>
                {contenido}
              </a>
            );
          })}

          {puntos.length > 0 && (
            <>
              <polygon points={puntosSvg} fill="var(--primary)" fillOpacity={0.3} stroke="var(--primary)" strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
              {puntos.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={0.6} fill="var(--primary)" stroke="var(--card)" strokeWidth={0.2} />
              ))}
            </>
          )}
        </svg>
      </div>

      {sinPosicionar.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Todavía sin delimitar en el plano ({sinPosicionar.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {sinPosicionar.map((t) => (
              <a
                key={t.id}
                href={`/admin/lotes/${t.id}`}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground hover:border-primary/40"
              >
                Lote {t.numero}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
