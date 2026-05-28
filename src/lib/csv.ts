type CsvValue = string | number | null | undefined;

function escapeValue(value: CsvValue) {
  const normalized = value == null ? "" : String(value);
  if (normalized.includes(",") || normalized.includes("\"") || normalized.includes("\n")) {
    return `"${normalized.replaceAll("\"", "\"\"")}"`;
  }

  return normalized;
}

export function toCsv(headers: string[], rows: CsvValue[][]) {
  const headerLine = headers.map(escapeValue).join(",");
  const body = rows.map((row) => row.map(escapeValue).join(",")).join("\n");
  return `${headerLine}\n${body}`;
}
