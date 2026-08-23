"use client";

import { useActionState, useRef, useState } from "react";
import { registrarPagoOwner } from "@/lib/actions/pagos";

function formatPeso(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

const METODOS = [
  {
    value: "transferencia",
    label: "Transferencia",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    value: "efectivo",
    label: "Efectivo",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: "mercado_pago",
    label: "Mercado Pago",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export function PagoFormOwner({
  facturaId,
  saldo,
}: {
  facturaId: string;
  saldo: number;
}) {
  const action = registrarPagoOwner.bind(null, facturaId);
  const [state, formAction, isPending] = useActionState(action, null);
  const [metodo, setMetodo] = useState<string>("");
  const [pagoTotal, setPagoTotal] = useState(true);
  const [montoCustom, setMontoCustom] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const montoFinal = pagoTotal ? saldo : Number(montoCustom) || 0;
  const success = state === "ok";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">¡Pago enviado!</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Tu comprobante fue recibido. El administrador lo confirmará a la brevedad y tu factura quedará al día.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Error */}
      {state && state !== "ok" && (
        <div className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state}
        </div>
      )}

      {/* ── PASO 1: Monto ───────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          1. ¿Cuánto vas a pagar?
        </p>

        {/* Opción pago total */}
        <button
          type="button"
          onClick={() => setPagoTotal(true)}
          className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
            pagoTotal
              ? "border-primary bg-primary-soft"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div>
            <p className={`text-sm font-semibold ${pagoTotal ? "text-primary" : "text-foreground"}`}>
              Pagar el total
            </p>
            <p className="text-xs text-muted-foreground">Cierra la factura completamente</p>
          </div>
          <p className={`text-base font-bold ${pagoTotal ? "text-primary" : "text-foreground"}`}>
            {formatPeso(saldo)}
          </p>
        </button>

        {/* Opción pago parcial */}
        <button
          type="button"
          onClick={() => setPagoTotal(false)}
          className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
            !pagoTotal
              ? "border-primary bg-primary-soft"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div>
            <p className={`text-sm font-semibold ${!pagoTotal ? "text-primary" : "text-foreground"}`}>
              Pago parcial
            </p>
            <p className="text-xs text-muted-foreground">Ingresá el monto que vas a abonar</p>
          </div>
          <svg className={`h-4 w-4 ${!pagoTotal ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Input de monto custom */}
        {!pagoTotal && (
          <div className="relative mt-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-semibold text-muted-foreground">
              $
            </span>
            <input
              id="monto-custom"
              type="number"
              min="1"
              max={saldo}
              step="1"
              value={montoCustom}
              onChange={(e) => setMontoCustom(e.target.value)}
              placeholder={`Máximo ${Math.floor(saldo)}`}
              className="w-full rounded-xl border-2 border-primary bg-primary-soft pl-8 pr-4 py-3 text-lg font-bold text-primary placeholder:text-primary/40 focus:outline-none"
              autoFocus
            />
          </div>
        )}

        {/* Campo oculto para el servidor */}
        <input type="hidden" name="monto" value={pagoTotal ? saldo : montoCustom} />
      </div>

      {/* ── PASO 2: Fecha ───────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          2. ¿Cuándo realizaste el pago?
        </p>
        <input
          name="fecha"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
          className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* ── PASO 3: Método ──────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          3. ¿Cómo pagaste?
        </p>
        <input type="hidden" name="metodo" value={metodo} />
        <div className="grid grid-cols-3 gap-2">
          {METODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMetodo(m.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all ${
                metodo === m.value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {m.icon}
              <span className="text-xs font-medium leading-tight">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── PASO 4: Comprobante ─────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          4. Adjuntá tu comprobante{" "}
          <span className="normal-case font-normal text-muted-foreground">(recomendado)</span>
        </p>

        {filePreview ? (
          /* Preview de imagen */
          <div className="relative rounded-xl overflow-hidden border-2 border-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={filePreview} alt="Comprobante" className="w-full max-h-48 object-cover" />
            <button
              type="button"
              onClick={() => { setFileName(null); setFilePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute top-2 right-2 rounded-full bg-card/80 backdrop-blur p-1 text-foreground hover:bg-card"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : fileName ? (
          /* PDF adjuntado */
          <div className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary-soft px-4 py-3">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-primary truncate max-w-[200px]">{fileName}</span>
            </div>
            <button
              type="button"
              onClick={() => { setFileName(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="text-primary hover:text-primary/70"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          /* Zona de drop */
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted py-6 text-center transition-colors hover:border-primary hover:bg-primary-soft"
          >
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground">Tocá para adjuntar</p>
              <p className="text-xs text-muted-foreground mt-0.5">Foto, captura de pantalla o PDF</p>
            </div>
          </button>
        )}
        <input
          ref={fileRef}
          name="comprobante"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Botón de envío ──────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending || !metodo || montoFinal <= 0}
        className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Enviando pago…
          </span>
        ) : (
          `Confirmar pago de ${formatPeso(montoFinal)}`
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        El administrador revisará tu pago y confirmará a la brevedad.
      </p>
    </form>
  );
}
