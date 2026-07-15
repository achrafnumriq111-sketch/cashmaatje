import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n || 0);

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
};

export interface StatementOptions {
  orgId: string;
  contactId: string;
  contactName: string;
  contactEmail?: string | null;
  dateFrom: string;
  dateTo: string;
}

export async function generateClientStatementPdf(opts: StatementOptions) {
  // Fetch org branding
  const { data: org } = await supabase
    .from("organizations")
    .select("name, logo_url, address_street, address_postal_code, address_city, email, iban, settings")
    .eq("id", opts.orgId)
    .single();

  const settings = (org?.settings as any) || {};
  const primary = settings.brand_primary || "#0f1011";

  // Fetch invoices for this contact
  const { data: invoices } = await supabase
    .from("invoices")
    .select("invoice_number, invoice_date, due_date, total_amount, amount_paid, status")
    .eq("organization_id", opts.orgId)
    .eq("contact_id", opts.contactId)
    .eq("invoice_type", "sales")
    .gte("invoice_date", opts.dateFrom)
    .lte("invoice_date", opts.dateTo)
    .order("invoice_date", { ascending: true });

  const rows = invoices ?? [];
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Header
  doc.setFillColor(primary);
  doc.rect(0, 0, 595, 90, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(org?.name || "Klantstatement", 40, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Klantstatement", 40, 65);
  if (org?.email) doc.text(org.email, 40, 78);

  // Contact block
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Aan:", 40, 130);
  doc.setFont("helvetica", "normal");
  doc.text(opts.contactName, 40, 145);
  if (opts.contactEmail) doc.text(opts.contactEmail, 40, 158);

  doc.setFont("helvetica", "bold");
  doc.text("Periode:", 400, 130);
  doc.setFont("helvetica", "normal");
  doc.text(`${fmtDate(opts.dateFrom)} - ${fmtDate(opts.dateTo)}`, 400, 145);

  // Running balance calculation
  let running = 0;
  const body = rows.map((r: any) => {
    const total = Number(r.total_amount) || 0;
    const paid = Number(r.amount_paid) || 0;
    const open = total - paid;
    running += open;
    return [
      r.invoice_number,
      fmtDate(r.invoice_date),
      fmtDate(r.due_date),
      fmt(total),
      fmt(paid),
      fmt(open),
      fmt(running),
    ];
  });

  autoTable(doc, {
    startY: 190,
    head: [["Factuur", "Datum", "Vervaldatum", "Bedrag", "Betaald", "Open", "Saldo"]],
    body,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255 },
    columnStyles: {
      3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right", fontStyle: "bold" },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 200;
  const totalOpen = running;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Totaal openstaand: ${fmt(totalOpen)}`, 40, finalY + 30);

  // Footer with payment info
  if (totalOpen > 0.01 && org?.iban) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`Gelieve openstaand bedrag over te maken naar IBAN: ${org.iban}`, 40, finalY + 55);
    doc.text(`Onder vermelding van uw klantnaam.`, 40, finalY + 68);
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Gegenereerd op ${new Date().toLocaleString("nl-NL")}`, 40, 820);

  doc.save(`statement-${opts.contactName.replace(/[^a-z0-9]/gi, "_")}-${new Date().toISOString().slice(0, 10)}.pdf`);
  return { totalOpen, invoiceCount: rows.length };
}
