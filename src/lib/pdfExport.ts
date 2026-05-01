import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n || 0);

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
};

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text(title, 40, 50);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(subtitle, 40, 68);
  }

  doc.setDrawColor(230);
  doc.setLineWidth(0.5);
  doc.line(40, 80, 555, 80);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    const stamp = `Gegenereerd op ${new Date().toLocaleString("nl-NL")} · pagina ${i}/${pageCount}`;
    doc.text(stamp, 40, 820);
  }
}

/* ---------- Invoices export ---------- */

export interface InvoicePdfRow {
  invoice_number: string;
  invoice_date: string;
  contact_name: string | null;
  subtotal: number;
  total_vat: number;
  total_amount: number;
  status: string;
  due_date: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Concept", sent: "Verzonden", paid: "Betaald", partial: "Deelbetaling",
  overdue: "Verlopen", cancelled: "Geannuleerd",
};

export function exportInvoicesPDF(opts: {
  type: "sales" | "purchase";
  invoices: InvoicePdfRow[];
  dateFrom: string;
  dateTo: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const title = opts.type === "sales" ? "Verkoopfacturen" : "Inkoopfacturen";
  const subtitle = `Periode ${fmtDate(opts.dateFrom)} – ${fmtDate(opts.dateTo)} · ${opts.invoices.length} facturen`;
  addHeader(doc, title, subtitle);

  const totals = opts.invoices.reduce(
    (acc, i) => {
      acc.sub += Number(i.subtotal) || 0;
      acc.vat += Number(i.total_vat) || 0;
      acc.tot += Number(i.total_amount) || 0;
      return acc;
    },
    { sub: 0, vat: 0, tot: 0 }
  );

  const body: RowInput[] = opts.invoices.map((i) => [
    i.invoice_number,
    fmtDate(i.invoice_date),
    i.contact_name ?? "—",
    STATUS_LABEL[i.status] ?? i.status,
    fmtDate(i.due_date),
    { content: fmt(i.subtotal), styles: { halign: "right" } },
    { content: fmt(i.total_vat), styles: { halign: "right" } },
    { content: fmt(i.total_amount), styles: { halign: "right", fontStyle: "bold" } },
  ]);

  body.push([
    { content: "Totaal", colSpan: 5, styles: { fontStyle: "bold", fillColor: [245, 245, 245] } },
    { content: fmt(totals.sub), styles: { halign: "right", fontStyle: "bold", fillColor: [245, 245, 245] } },
    { content: fmt(totals.vat), styles: { halign: "right", fontStyle: "bold", fillColor: [245, 245, 245] } },
    { content: fmt(totals.tot), styles: { halign: "right", fontStyle: "bold", fillColor: [245, 245, 245] } },
  ]);

  autoTable(doc, {
    startY: 95,
    head: [["Nummer", "Datum", "Relatie", "Status", "Vervaldatum", "Excl.", "BTW", "Totaal"]],
    body,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [20, 20, 20], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 40, right: 40 },
  });

  addFooter(doc);
  doc.save(`${opts.type === "sales" ? "verkoopfacturen" : "inkoopfacturen"}-${opts.dateFrom}_${opts.dateTo}.pdf`);
}

/* ---------- Transactions export ---------- */

export interface TransactionPdfRow {
  transaction_date: string;
  description: string | null;
  counterparty_name: string | null;
  amount: number;
  status: string;
  accounts?: { code: string; name_nl: string | null; name: string } | null;
}

const TX_STATUS_LABEL: Record<string, string> = {
  new: "Nieuw", matched: "Gematcht", manually_matched: "Handmatig",
  excluded: "Uitgesloten", reconciled: "Afgeletterd", partial_match: "Deelmatch",
};

export function exportTransactionsPDF(opts: {
  transactions: TransactionPdfRow[];
  dateFrom: string;
  dateTo: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  addHeader(
    doc,
    "Transacties",
    `Periode ${fmtDate(opts.dateFrom)} – ${fmtDate(opts.dateTo)} · ${opts.transactions.length} transacties`
  );

  const totals = opts.transactions.reduce(
    (acc, t) => {
      const v = Number(t.amount) || 0;
      if (v >= 0) acc.in += v;
      else acc.out += v;
      return acc;
    },
    { in: 0, out: 0 }
  );

  const body: RowInput[] = opts.transactions.map((t) => [
    fmtDate(t.transaction_date),
    t.counterparty_name ?? "—",
    t.description ?? "—",
    t.accounts ? `${t.accounts.code} ${t.accounts.name_nl ?? t.accounts.name}` : "—",
    TX_STATUS_LABEL[t.status] ?? t.status,
    { content: fmt(t.amount), styles: { halign: "right", textColor: t.amount >= 0 ? [15, 123, 108] : [180, 30, 30] } },
  ]);

  body.push([
    { content: "Inkomend", colSpan: 5, styles: { fontStyle: "bold", fillColor: [245, 245, 245] } },
    { content: fmt(totals.in), styles: { halign: "right", fontStyle: "bold", fillColor: [245, 245, 245], textColor: [15, 123, 108] } },
  ]);
  body.push([
    { content: "Uitgaand", colSpan: 5, styles: { fontStyle: "bold", fillColor: [245, 245, 245] } },
    { content: fmt(totals.out), styles: { halign: "right", fontStyle: "bold", fillColor: [245, 245, 245], textColor: [180, 30, 30] } },
  ]);
  body.push([
    { content: "Saldo", colSpan: 5, styles: { fontStyle: "bold", fillColor: [235, 235, 235] } },
    { content: fmt(totals.in + totals.out), styles: { halign: "right", fontStyle: "bold", fillColor: [235, 235, 235] } },
  ]);

  autoTable(doc, {
    startY: 95,
    head: [["Datum", "Tegenpartij", "Omschrijving", "Categorie", "Status", "Bedrag"]],
    body,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [20, 20, 20], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 40, right: 40 },
  });

  addFooter(doc);
  doc.save(`transacties-${opts.dateFrom}_${opts.dateTo}.pdf`);
}

/* ---------- VAT return export ---------- */

export interface VatBoxRow {
  code: string;
  label: string;
  base?: number;
  vat?: number;
  highlight?: boolean;
}

export function exportVatReturnPDF(opts: {
  periodLabel: string;
  status: string;
  rows: VatBoxRow[];
  outputVat: number;
  inputVat: number;
  netVat: number;
  warnings?: string[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  addHeader(doc, "BTW-aangifte", `${opts.periodLabel} · Status: ${opts.status}`);

  // Summary block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text("Samenvatting", 40, 105);

  autoTable(doc, {
    startY: 115,
    body: [
      ["Verschuldigde BTW (5a)", { content: fmt(opts.outputVat), styles: { halign: "right" } }],
      ["Voorbelasting (5b)", { content: fmt(opts.inputVat), styles: { halign: "right" } }],
      [
        { content: opts.netVat >= 0 ? "Te betalen (5f)" : "Te ontvangen (5f)", styles: { fontStyle: "bold" } },
        {
          content: fmt(Math.abs(opts.netVat)),
          styles: {
            halign: "right",
            fontStyle: "bold",
            textColor: opts.netVat >= 0 ? [180, 30, 30] : [15, 123, 108],
          },
        },
      ],
    ],
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { cellWidth: 360 }, 1: { cellWidth: 155 } },
    theme: "plain",
    margin: { left: 40, right: 40 },
  });

  // Detailed rubrieken
  const body: RowInput[] = opts.rows.map((r) => [
    { content: r.code, styles: { fontStyle: "bold", textColor: 90 } },
    r.label,
    { content: r.base != null ? fmt(r.base) : "—", styles: { halign: "right" } },
    {
      content: r.vat != null ? fmt(r.vat) : "—",
      styles: { halign: "right", fontStyle: r.highlight ? "bold" : "normal" },
    },
  ]);

  // @ts-ignore
  const lastY = (doc as any).lastAutoTable.finalY || 200;

  autoTable(doc, {
    startY: lastY + 20,
    head: [["Rubriek", "Omschrijving", "Grondslag", "BTW"]],
    body,
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [20, 20, 20], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 40, right: 40 },
  });

  if (opts.warnings && opts.warnings.length) {
    // @ts-ignore
    const y = (doc as any).lastAutoTable.finalY + 25;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(180, 30, 30);
    doc.text("Waarschuwingen", 40, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80);
    opts.warnings.forEach((w, i) => {
      doc.text(`• ${w}`, 40, y + 16 + i * 14, { maxWidth: 515 });
    });
  }

  addFooter(doc);
  doc.save(`btw-aangifte-${opts.periodLabel.replace(/[^\w]+/g, "-").toLowerCase()}.pdf`);
}
