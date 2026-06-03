import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { useAuth } from "@/lib/auth";

export interface QuoteLine {
  id: string;
  type: "service" | "product" | "package";
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  optional: boolean;
  discount: number;
}

export interface QuoteRecord {
  id: string;
  organization_id: string;
  quote_number: string;
  contact_id: string | null;
  client_name: string;
  client_email: string | null;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  quote_date: string;
  valid_until: string | null;
  validity_days: number;
  payment_terms: string | null;
  lines: QuoteLine[];
  branding: Record<string, any>;
  subtotal: number;
  total_vat: number;
  total_amount: number;
  notes: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  converted_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveQuoteInput {
  id?: string;
  contact_id?: string | null;
  client_name: string;
  client_email?: string | null;
  status?: QuoteRecord["status"];
  quote_date?: string;
  validity_days?: number;
  payment_terms?: string | null;
  lines: QuoteLine[];
  branding: Record<string, any>;
  notes?: string | null;
}

function computeTotals(lines: QuoteLine[]) {
  const active = lines.filter((l) => !l.optional);
  const subtotal = active.reduce(
    (s, l) => s + l.quantity * l.unitPrice * (1 - l.discount / 100),
    0,
  );
  const total_vat = active.reduce((s, l) => {
    const t = l.quantity * l.unitPrice * (1 - l.discount / 100);
    return s + t * (l.vatRate / 100);
  }, 0);
  return { subtotal, total_vat, total_amount: subtotal + total_vat };
}

export function useQuotes() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  return useQuery({
    queryKey: ["quotes", orgId],
    queryFn: async (): Promise<QuoteRecord[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("quotes" as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!orgId,
  });
}

export function useSaveQuote() {
  const { membership } = useOrganization();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = membership?.organizationId;

  return useMutation({
    mutationFn: async (input: SaveQuoteInput): Promise<QuoteRecord> => {
      if (!orgId) throw new Error("Geen actieve organisatie");
      const totals = computeTotals(input.lines);
      const validUntil = input.quote_date
        ? new Date(
            new Date(input.quote_date).getTime() +
              (input.validity_days ?? 30) * 86400_000,
          )
            .toISOString()
            .slice(0, 10)
        : null;

      if (input.id) {
        const { data, error } = await supabase
          .from("quotes" as any)
          .update({
            contact_id: input.contact_id ?? null,
            client_name: input.client_name,
            client_email: input.client_email ?? null,
            status: input.status ?? "draft",
            quote_date: input.quote_date,
            valid_until: validUntil,
            validity_days: input.validity_days ?? 30,
            payment_terms: input.payment_terms ?? null,
            lines: input.lines as any,
            branding: input.branding as any,
            notes: input.notes ?? null,
            ...totals,
          })
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data as any;
      }

      // Generate quote number
      const { count } = await supabase
        .from("quotes" as any)
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);
      const year = new Date().getFullYear();
      const quote_number = `Q${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;

      const { data, error } = await supabase
        .from("quotes" as any)
        .insert({
          organization_id: orgId,
          quote_number,
          contact_id: input.contact_id ?? null,
          client_name: input.client_name,
          client_email: input.client_email ?? null,
          status: input.status ?? "draft",
          quote_date: input.quote_date ?? new Date().toISOString().slice(0, 10),
          valid_until: validUntil,
          validity_days: input.validity_days ?? 30,
          payment_terms: input.payment_terms ?? null,
          lines: input.lines as any,
          branding: input.branding as any,
          notes: input.notes ?? null,
          created_by: user?.id,
          ...totals,
        })
        .select()
        .single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes", orgId] }),
  });
}

export function useUpdateQuoteStatus() {
  const { membership } = useOrganization();
  const qc = useQueryClient();
  const orgId = membership?.organizationId;
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: QuoteRecord["status"];
    }) => {
      const stamps: Record<string, string> = {};
      if (status === "sent") stamps.sent_at = new Date().toISOString();
      if (status === "accepted") stamps.accepted_at = new Date().toISOString();
      if (status === "rejected") stamps.rejected_at = new Date().toISOString();
      const { error } = await supabase
        .from("quotes" as any)
        .update({ status, ...stamps })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes", orgId] }),
  });
}

export function useDeleteQuote() {
  const { membership } = useOrganization();
  const qc = useQueryClient();
  const orgId = membership?.organizationId;
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes", orgId] }),
  });
}

// Generate quote PDF using jsPDF
export async function generateQuotePdf(quote: {
  quote_number: string;
  client_name: string;
  client_email?: string | null;
  quote_date: string;
  valid_until?: string | null;
  payment_terms?: string | null;
  lines: QuoteLine[];
  branding: Record<string, any>;
  subtotal: number;
  total_vat: number;
  total_amount: number;
  notes?: string | null;
}) {
  const [{ default: jsPDF }, autotable] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = (autotable as any).default;

  const fmt = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
      n || 0,
    );

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const b = quote.branding ?? {};
  const primary = b.primaryColor || "#10B981";

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primary);
  doc.text("OFFERTE", 40, 60);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.setFont("helvetica", "normal");
  doc.text(quote.quote_number, 40, 78);

  // Company info (right)
  const companyLines = [
    b.companyName || "",
    b.companyAddress || "",
    b.kvkNumber ? `KvK: ${b.kvkNumber}` : "",
    b.btwNumber ? `BTW: ${b.btwNumber}` : "",
    b.iban ? `IBAN: ${b.iban}` : "",
  ].filter(Boolean);
  let y = 50;
  companyLines.forEach((l) => {
    doc.text(l, 555, y, { align: "right" });
    y += 13;
  });

  // Client block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("Aan:", 40, 130);
  doc.setFont("helvetica", "normal");
  doc.text(quote.client_name, 40, 146);
  if (quote.client_email) doc.text(quote.client_email, 40, 160);

  // Meta block
  doc.text(
    `Datum: ${new Date(quote.quote_date).toLocaleDateString("nl-NL")}`,
    555,
    130,
    { align: "right" },
  );
  if (quote.valid_until)
    doc.text(
      `Geldig tot: ${new Date(quote.valid_until).toLocaleDateString("nl-NL")}`,
      555,
      146,
      { align: "right" },
    );
  if (quote.payment_terms)
    doc.text(`Betaling: ${quote.payment_terms}`, 555, 160, { align: "right" });

  // Lines table
  autoTable(doc, {
    startY: 190,
    head: [["Omschrijving", "Aantal", "Prijs", "BTW", "Totaal"]],
    body: quote.lines.map((l) => {
      const lineTotal = l.quantity * l.unitPrice * (1 - l.discount / 100);
      return [
        l.description + (l.optional ? " (optioneel)" : ""),
        String(l.quantity),
        fmt(l.unitPrice),
        `${l.vatRate}%`,
        fmt(lineTotal),
      ];
    }),
    headStyles: { fillColor: primary, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 6 },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "center" },
      4: { halign: "right" },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;

  // Totals
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotaal:", 400, finalY);
  doc.text(fmt(quote.subtotal), 555, finalY, { align: "right" });
  doc.text("BTW:", 400, finalY + 16);
  doc.text(fmt(quote.total_vat), 555, finalY + 16, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Totaal:", 400, finalY + 36);
  doc.text(fmt(quote.total_amount), 555, finalY + 36, { align: "right" });

  // Footer
  if (b.footerText) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(b.footerText, 40, 800);
  }

  doc.save(`${quote.quote_number}.pdf`);
}
