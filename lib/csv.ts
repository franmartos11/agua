// Parser simple para CSVs de una sola línea por fila (sin saltos de línea
// dentro de campos). Soporta campos entre comillas con comas escapadas ("").
export function parseCsv(text: string): string[][] {
  return text
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim().length > 0)
    .map((line) => splitLine(line));
}

function splitLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}
