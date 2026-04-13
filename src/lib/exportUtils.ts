import * as XLSX from "xlsx";

interface ExportColumn {
  header: string;
  key: string;
  format?: "currency" | "date" | "number" | "text";
}

export function exportToExcel(
  data: Record<string, any>[],
  columns: ExportColumn[],
  fileName: string,
  sheetName = "Data"
) {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      if (col.format === "currency" && typeof val === "number") return val;
      if (col.format === "date" && val) return val;
      return val ?? "";
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto-width
  const colWidths = columns.map((col, i) => {
    const maxLen = Math.max(
      col.header.length,
      ...rows.map((r) => String(r[i] ?? "").length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportMultiSheet(
  sheets: { name: string; data: Record<string, any>[]; columns: ExportColumn[] }[],
  fileName: string
) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, data, columns }) => {
    const headers = columns.map((c) => c.header);
    const rows = data.map((row) => columns.map((col) => row[col.key] ?? ""));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = columns.map((col, i) => ({
      wch: Math.min(Math.max(col.header.length, ...rows.map((r) => String(r[i] ?? "").length)) + 2, 40),
    }));
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
  });
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
