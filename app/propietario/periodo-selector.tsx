"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/components/ui/field";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function PeriodoSelector({
  periodos,
  selected,
}: {
  periodos: { mes: number; anio: number }[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => router.push(`/propietario?periodo=${e.target.value}`)}
      className={`w-fit ${inputClass}`}
    >
      {periodos.map((p) => {
        const value = `${p.anio}-${String(p.mes).padStart(2, "0")}`;
        return (
          <option key={value} value={value}>
            {MESES[p.mes - 1]} {p.anio}
          </option>
        );
      })}
    </select>
  );
}
