"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";

const UMBRAL_CONSUMO_ANOMALO_M3 = 500;

export async function agregarLectura(
  medidorId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const valor = Number(formData.get("valor"));
  const fecha = (formData.get("fecha") as string) || undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ultima } = await supabase
    .from("lectura")
    .select("valor, fecha")
    .eq("medidor_id", medidorId)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ultima && valor < ultima.valor) {
    return `El valor no puede ser menor a la última lectura (${ultima.valor} m³ el ${ultima.fecha}).`;
  }

  const { error } = await supabase.from("lectura").insert({
    medidor_id: medidorId,
    valor,
    fecha,
    fuente: "manual",
    cargado_por: user?.id,
  });

  if (error) {
    return `No se pudo cargar: ${error.message}`;
  }

  revalidatePath(`/admin/medidores/${medidorId}`);
  return "ok";
}

export type ImportResult = {
  insertados: number;
  errores: string[];
  advertencias: string[];
} | null;

export async function importarLecturas(
  _prevState: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  const archivo = formData.get("archivo") as File | null;

  if (!archivo || archivo.size === 0) {
    return { insertados: 0, errores: ["Elegí un archivo CSV."], advertencias: [] };
  }

  const texto = await archivo.text();
  const filas = parseCsv(texto);

  if (filas.length < 2) {
    return {
      insertados: 0,
      errores: ["El archivo está vacío o no tiene filas de datos."],
      advertencias: [],
    };
  }

  const encabezado = filas[0].map((c) => c.toLowerCase());
  const idxSerie = encabezado.indexOf("numero_serie");
  const idxValor = encabezado.indexOf("valor");
  const idxFecha = encabezado.indexOf("fecha");

  if (idxSerie === -1 || idxValor === -1) {
    return {
      insertados: 0,
      errores: ['El archivo debe tener columnas "numero_serie" y "valor" (y opcionalmente "fecha").'],
      advertencias: [],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const filasDatos = filas.slice(1);
  const numerosSerie = [...new Set(filasDatos.map((f) => f[idxSerie]))];

  const { data: medidores } = await supabase
    .from("medidor")
    .select("id, numero_serie")
    .in("numero_serie", numerosSerie);

  const medidorPorSerie = new Map(medidores?.map((m) => [m.numero_serie, m.id]));

  const { data: ultimasLecturas } = await supabase
    .from("lectura")
    .select("medidor_id, valor, fecha")
    .in("medidor_id", medidores?.map((m) => m.id) ?? [])
    .order("fecha", { ascending: false });

  const ultimaPorMedidor = new Map<string, number>();
  for (const l of ultimasLecturas ?? []) {
    if (!ultimaPorMedidor.has(l.medidor_id)) ultimaPorMedidor.set(l.medidor_id, l.valor);
  }

  const errores: string[] = [];
  const advertencias: string[] = [];
  const paraInsertar: {
    medidor_id: string;
    valor: number;
    fecha?: string;
    fuente: string;
    cargado_por?: string;
  }[] = [];

  filasDatos.forEach((fila, i) => {
    const nFila = i + 2; // +1 por header, +1 por índice base 1
    const serie = fila[idxSerie];
    const valor = Number(fila[idxValor]);
    const fecha = idxFecha !== -1 ? fila[idxFecha] || undefined : undefined;

    const medidorId = medidorPorSerie.get(serie);
    if (!medidorId) {
      errores.push(`Fila ${nFila}: no existe un medidor con serie "${serie}".`);
      return;
    }
    if (Number.isNaN(valor) || valor < 0) {
      errores.push(`Fila ${nFila}: valor inválido ("${fila[idxValor]}").`);
      return;
    }

    const anterior = ultimaPorMedidor.get(medidorId);
    if (anterior !== undefined) {
      const consumo = valor - anterior;
      if (consumo < 0) {
        errores.push(
          `Fila ${nFila}: el valor (${valor}) es menor a la última lectura registrada (${anterior}) para "${serie}".`,
        );
        return;
      }
      if (consumo > UMBRAL_CONSUMO_ANOMALO_M3) {
        advertencias.push(
          `Fila ${nFila}: consumo de ${consumo} m³ para "${serie}" — revisar antes de facturar.`,
        );
      }
    }

    paraInsertar.push({
      medidor_id: medidorId,
      valor,
      fecha,
      fuente: "importado",
      cargado_por: user?.id,
    });
    ultimaPorMedidor.set(medidorId, valor);
  });

  if (paraInsertar.length > 0) {
    const { error } = await supabase.from("lectura").insert(paraInsertar);
    if (error) {
      errores.push(`Error al guardar: ${error.message}`);
      return { insertados: 0, errores, advertencias };
    }
  }

  revalidatePath("/admin/lecturas");
  return { insertados: paraInsertar.length, errores, advertencias };
}
