import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { previewInvoiceNumbers } from "./validators";

interface SampleArgs {
  companyName?: string;
  logoDataUrl?: string | null;
  numbering: { prefix: string; format: string; nextSeq: number };
}

/**
 * Genereert een voorbeeld-factuur PDF op basis van de gekozen huisstijl
 * en factuurnummering. Bevat fictieve regels en is duidelijk gemarkeerd
 * als "VOORBEELD".
 */
export function generateSampleInvoicePdf({ companyName, logoDataUrl, numbering }: SampleArgs) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  // Watermark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(60);
  doc.setTextColor(240);
  doc.text("VOORBEELD", w / 2, 420, { align: "center", angle: -25 });

  // Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 40, 40, 90, 90, undefined, "FAST");
    } catch {
      /* svg/unsupported — skip */
    }
  }

  // Header
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FACTUUR", w - 40, 60, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  const factuurNr = previewInvoiceNumbers(numbering, 1)[0];
  doc.text(`Factuurnr.  ${factuurNr}`, w - 40, 78, { align: "right" });
  doc.text(`Datum       ${new Date().toLocaleDateString("nl-NL")}`, w - 40, 92, { align: "right" });
  doc.text(`Vervaldatum ${new Date(Date.now() + 30 * 86400e3).toLocaleDateString("nl-NL")}`, w - 40, 106, { align: "right" });

  // Sender
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(companyName || "Jouw Bedrijfsnaam", 150, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Voorbeeldstraat 1\n1234 AB Amsterdam\nKVK 00000000 · BTW NL000000000B01", 150, 76);

  // Recipient
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text("Factuur aan", 40, 170);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Voorbeeldklant B.V.\nKlantstraat 99\n5678 CD Utrecht", 40, 186);

  // Lines
  autoTable(doc, {
    startY: 240,
    head: [["Omschrijving", "Aantal", "Prijs", "BTW", "Totaal"]],
    body: [
      ["Voorbeeld dienst — uur consultancy", "10", "€ 95,00", "21%", "€ 950,00"],
      ["Voorbeeld product — licentie", "1", "€ 249,00", "21%", "€ 249,00"],
      ["Voorbeeld dienst — onderhoud", "2", "€ 75,00", "21%", "€ 150,00"],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [240, 240, 240], textColor: 20 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  // Totals
  // @ts-expect-error jspdf-autotable extends doc
  const finalY: number = doc.lastAutoTable?.finalY ?? 340;
  const totals = [
    ["Subtotaal", "€ 1.349,00"],
    ["BTW 21%", "€ 283,29"],
    ["Totaal", "€ 1.632,29"],
  ];
  doc.setFontSize(10);
  let y = finalY + 24;
  for (const [label, amount] of totals) {
    const bold = label === "Totaal";
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(bold ? 20 : 90);
    doc.text(label, w - 200, y);
    doc.text(amount, w - 40, y, { align: "right" });
    y += 18;
  }

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "Dit is een gegenereerd voorbeeld zonder echte data. Alleen bedoeld om opmaak en factuurnummering te beoordelen.",
    w / 2,
    800,
    { align: "center" },
  );

  doc.save(`voorbeeld-factuur-${factuurNr}.pdf`);
}
