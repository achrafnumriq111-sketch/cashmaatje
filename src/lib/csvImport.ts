/**
 * Tiny CSV parser used by onboarding importers.
 * Supports quoted fields, commas/semicolons, \r\n / \n line endings.
 */
export function parseCsv(text: string, opts?: { delimiter?: string }): string[][] {
  const rows: string[][] = [];
  const delim = opts?.delimiter ?? detectDelimiter(text);
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === delim) { cur.push(field); field = ""; continue; }
    if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; continue; }
    if (c === "\r") continue;
    field += c;
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0] === ""));
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  return semi > comma ? ";" : ",";
}

/** Maps CSV rows to objects using the header row, lowercasing/normalising keys. */
export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });
}

/** Builds a CSV file download from rows. */
export function downloadCsvTemplate(filename: string, headers: string[], sampleRows: string[][] = []) {
  const escape = (v: string) => /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [headers.map(escape).join(",")];
  for (const r of sampleRows) lines.push(r.map(escape).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parses a Dutch-style decimal: "1.234,56" or "1234.56" or "1234,56". */
export function parseAmount(v: string): number {
  if (!v) return 0;
  const s = v.replace(/\s/g, "");
  // If both . and , exist, the right-most is the decimal separator.
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      return parseFloat(s.replace(/\./g, "").replace(",", "."));
    }
    return parseFloat(s.replace(/,/g, ""));
  }
  if (s.includes(",")) return parseFloat(s.replace(",", "."));
  return parseFloat(s);
}
