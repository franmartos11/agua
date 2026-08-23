"use client";

import { buttonVariants } from "@/components/ui/button";

function toCsv(rows: Record<string, string | number>[]) {
  if (rows.length === 0) return "";
  const columnas = Object.keys(rows[0]);
  const escapar = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [
    columnas.join(","),
    ...rows.map((r) => columnas.map((c) => escapar(r[c])).join(",")),
  ];
  return lineas.join("\n");
}

export function ExportCsvButton({
  rows,
  filename,
  label = "Exportar CSV",
}: {
  rows: Record<string, string | number>[];
  filename: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const csv = toCsv(rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
      className={buttonVariants({ variant: "secondary", className: "print:hidden" })}
    >
      {label}
    </button>
  );
}
