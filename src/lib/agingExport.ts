import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AgingContactGroup } from "@/hooks/useInvoiceAging";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n || 0);

export function exportAgingCsv(groups: AgingContactGroup[]) {
  const header = ["Klant", "Niet vervallen", "0-30", "31-60", "61-90", "90+", "Totaal"];
  const rows = groups.map((g) => [
    g.contact_name,
    g.totals.not_due.toFixed(2),
    g.totals.b0_30.toFixed(2),
    g.totals.b31_60.toFixed(2),
    g.totals.b61_90.toFixed(2),
    g.totals.b90_plus.toFixed(2),
    g.totals.total.toFixed(2),
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aging-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAgingPdf(groups: AgingContactGroup[], totals: AgingContactGroup["totals"]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Aging Report", 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Gegenereerd op ${new Date().toLocaleDateString("nl-NL")}`, 40, 68);

  autoTable(doc, {
    startY: 90,
    head: [["Klant", "Niet vervallen", "0-30", "31-60", "61-90", "90+", "Totaal"]],
    body: [
      ...groups.map((g) => [
        g.contact_name,
        fmt(g.totals.not_due),
        fmt(g.totals.b0_30),
        fmt(g.totals.b31_60),
        fmt(g.totals.b61_90),
        fmt(g.totals.b90_plus),
        fmt(g.totals.total),
      ]),
      [
        "TOTAAL",
        fmt(totals.not_due),
        fmt(totals.b0_30),
        fmt(totals.b31_60),
        fmt(totals.b61_90),
        fmt(totals.b90_plus),
        fmt(totals.total),
      ],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 160 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right", fontStyle: "bold" },
    },
    foot: [],
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === groups.length) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  doc.save(`aging-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
