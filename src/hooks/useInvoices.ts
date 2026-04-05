import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import type { Database } from "@/integrations/supabase/types";

type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
type InvoiceType = Database["public"]["Enums"]["invoice_type"];
type VatRateType = Database["public"]["Enums"]["vat_rate_type"];

export interface InvoiceFilters {
  status: InvoiceStatus | "all";
  dateFrom: string;
  dateTo: string;
  search: string;
}

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate_type: VatRateType;
  vat_percentage: number;
}

export interface CreateInvoiceInput {
  contact_id: string | null;
  contact_name: string;
  invoice_date: string;
  due_date: string;
  invoice_type: InvoiceType;
  notes: string;
  lines: InvoiceLineInput[];
  status: "draft" | "sent";
}

const VAT_PERCENTAGES: Record<string, number> = {
  high: 21,
  low: 9,
  zero: 0,
  exempt: 0,
  reverse_charge: 0,
  icp: 0,
  export: 0,
  import: 21,
  margin: 0,
};

export function useInvoices(type: InvoiceType, filters: InvoiceFilters) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["invoices", type, orgId, filters],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*, contacts(name)")
        .eq("organization_id", orgId!)
        .eq("invoice_type", type)
        .gte("invoice_date", filters.dateFrom)
        .lte("invoice_date", filters.dateTo)
        .order("invoice_date", { ascending: false });

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.search) {
        query = query.or(
          `invoice_number.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContacts() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["contacts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNextInvoiceNumber(type: InvoiceType) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const year = new Date().getFullYear();

  return useQuery({
    queryKey: ["next-invoice-number", type, orgId, year],
    enabled: !!orgId,
    queryFn: async () => {
      const prefix = type === "sales" ? "VK" : "IK";
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .eq("invoice_type", type)
        .gte("invoice_date", `${year}-01-01`);

      const num = (count ?? 0) + 1;
      return `${prefix}${year}-${String(num).padStart(4, "0")}`;
    },
  });
}

function calculateLine(line: InvoiceLineInput) {
  const lineTotal = line.quantity * line.unit_price;
  const vatAmount = lineTotal * (line.vat_percentage / 100);
  return { lineTotal, vatAmount };
}

export function useCreateInvoice() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      if (!orgId) throw new Error("Geen organisatie");

      // Calculate totals
      let subtotal = 0;
      let totalVat = 0;
      const vatSummary: Record<string, { base: number; vat: number; percentage: number }> = {};

      const processedLines = input.lines.map((line, i) => {
        const { lineTotal, vatAmount } = calculateLine(line);
        subtotal += lineTotal;
        totalVat += vatAmount;

        const key = line.vat_rate_type;
        if (!vatSummary[key]) vatSummary[key] = { base: 0, vat: 0, percentage: line.vat_percentage };
        vatSummary[key].base += lineTotal;
        vatSummary[key].vat += vatAmount;

        return { ...line, lineTotal, vatAmount, lineNumber: i + 1 };
      });

      const totalAmount = subtotal + totalVat;

      // Create invoice
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          organization_id: orgId,
          invoice_number: "", // will be set below
          invoice_type: input.invoice_type,
          status: input.status === "sent" ? "sent" : "draft",
          contact_id: input.contact_id,
          contact_name: input.contact_name,
          invoice_date: input.invoice_date,
          due_date: input.due_date,
          subtotal,
          total_vat: totalVat,
          total_amount: totalAmount,
          amount_due: totalAmount,
          notes: input.notes || null,
          vat_summary: Object.entries(vatSummary).map(([type, v]) => ({
            rate_type: type,
            percentage: v.percentage,
            base: v.base,
            vat: v.vat,
          })),
        })
        .select()
        .single();

      if (invErr) throw invErr;

      // Generate invoice number
      const prefix = input.invoice_type === "sales" ? "VK" : "IK";
      const year = new Date(input.invoice_date).getFullYear();
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("invoice_type", input.invoice_type)
        .gte("invoice_date", `${year}-01-01`);

      const invoiceNumber = `${prefix}${year}-${String(count ?? 1).padStart(4, "0")}`;
      await supabase.from("invoices").update({ invoice_number: invoiceNumber }).eq("id", invoice.id);

      // Create invoice lines
      const lineInserts = processedLines.map((l) => ({
        invoice_id: invoice.id,
        line_number: l.lineNumber,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        vat_rate_type: l.vat_rate_type,
        vat_percentage: l.vat_percentage,
        vat_amount: l.vatAmount,
        line_total: l.lineTotal,
      }));

      const { error: lineErr } = await supabase.from("invoice_lines").insert(lineInserts);
      if (lineErr) throw lineErr;

      // If status is "sent", create journal entries
      if (input.status === "sent") {
        await createJournalEntries(orgId, invoice.id, input, processedLines, subtotal, totalVat, totalAmount);
      }

      return { ...invoice, invoice_number: invoiceNumber };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["next-invoice-number"] });
    },
  });
}

async function createJournalEntries(
  orgId: string,
  invoiceId: string,
  input: CreateInvoiceInput,
  lines: Array<InvoiceLineInput & { lineTotal: number; vatAmount: number; lineNumber: number }>,
  subtotal: number,
  totalVat: number,
  totalAmount: number
) {
  // Get debtors account (1300)
  const { data: debtorsAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("code", "1300")
    .single();

  if (!debtorsAccount) return;

  // Get revenue accounts per line
  const revenueAccounts: Record<string, string> = {};
  const vatAccounts: Record<string, string> = {};

  // Map vat_rate_type to revenue account codes
  const revenueCodeMap: Record<string, string> = {
    high: "4200",
    low: "4200",
    zero: "4200",
    exempt: "4200",
    reverse_charge: "4500",
    icp: "4300",
    export: "4400",
  };

  const vatCodeMap: Record<string, string> = {
    high: "2310",
    low: "2320",
    reverse_charge: "2330",
  };

  for (const line of lines) {
    const revCode = revenueCodeMap[line.vat_rate_type] || "4200";
    if (!revenueAccounts[revCode]) {
      const { data } = await supabase
        .from("accounts")
        .select("id")
        .eq("organization_id", orgId)
        .eq("code", revCode)
        .single();
      if (data) revenueAccounts[revCode] = data.id;
    }

    if (line.vatAmount > 0) {
      const vatCode = vatCodeMap[line.vat_rate_type] || "2310";
      if (!vatAccounts[vatCode]) {
        const { data } = await supabase
          .from("accounts")
          .select("id")
          .eq("organization_id", orgId)
          .eq("code", vatCode)
          .single();
        if (data) vatAccounts[vatCode] = data.id;
      }
    }
  }

  // Create journal entry
  const { data: entry, error: entryErr } = await supabase
    .from("journal_entries")
    .insert({
      organization_id: orgId,
      date: input.invoice_date,
      description: `Factuur ${input.contact_name}`,
      status: "posted",
      source_type: "invoice",
      source_id: invoiceId,
      posted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (entryErr || !entry) return;

  // Update invoice with journal entry
  await supabase.from("invoices").update({ journal_entry_id: entry.id }).eq("id", invoiceId);

  // Build journal lines
  const journalLines: Database["public"]["Tables"]["journal_lines"]["Insert"][] = [];
  let lineNum = 1;

  // Debit: Debiteuren
  journalLines.push({
    journal_entry_id: entry.id,
    line_number: lineNum++,
    account_id: debtorsAccount.id,
    debit_amount: totalAmount,
    credit_amount: 0,
    description: `Debiteuren - ${input.contact_name}`,
    contact_id: input.contact_id,
    invoice_id: invoiceId,
  });

  // Credit: Revenue per line group
  const revenueByCode: Record<string, number> = {};
  const vatByCode: Record<string, { amount: number; rateType: string; percentage: number }> = {};

  for (const line of lines) {
    const revCode = revenueCodeMap[line.vat_rate_type] || "4200";
    revenueByCode[revCode] = (revenueByCode[revCode] || 0) + line.lineTotal;

    if (line.vatAmount > 0) {
      const vatCode = vatCodeMap[line.vat_rate_type] || "2310";
      if (!vatByCode[vatCode]) {
        vatByCode[vatCode] = { amount: 0, rateType: line.vat_rate_type, percentage: line.vat_percentage };
      }
      vatByCode[vatCode].amount += line.vatAmount;
    }
  }

  for (const [code, amount] of Object.entries(revenueByCode)) {
    if (revenueAccounts[code]) {
      journalLines.push({
        journal_entry_id: entry.id,
        line_number: lineNum++,
        account_id: revenueAccounts[code],
        debit_amount: 0,
        credit_amount: amount,
        description: `Omzet`,
      });
    }
  }

  for (const [code, info] of Object.entries(vatByCode)) {
    if (vatAccounts[code]) {
      journalLines.push({
        journal_entry_id: entry.id,
        line_number: lineNum++,
        account_id: vatAccounts[code],
        debit_amount: 0,
        credit_amount: info.amount,
        description: `BTW ${info.percentage}%`,
        vat_rate_type: info.rateType as VatRateType,
        vat_percentage: info.percentage,
        vat_amount: info.amount,
      });
    }
  }

  await supabase.from("journal_lines").insert(journalLines);
}

export function validateVatSetup(
  contact: { is_eu?: boolean | null; is_domestic?: boolean | null; btw_number?: string | null; address_country?: string | null } | null,
  vatRateType: VatRateType
): { valid: boolean; warning?: string } {
  if (!contact) return { valid: true };

  const isDomestic = contact.is_domestic ?? contact.address_country === "NL";
  const isEU = contact.is_eu ?? false;

  if (vatRateType === "icp" && isDomestic) {
    return { valid: false, warning: "ICP is alleen voor EU-leveringen aan zakelijke klanten." };
  }
  if (vatRateType === "icp" && !contact.btw_number) {
    return { valid: false, warning: "BTW-nummer vereist voor ICP-leveringen." };
  }
  if (vatRateType === "reverse_charge" && isDomestic) {
    return { valid: false, warning: "BTW verlegd is niet mogelijk voor binnenlandse transacties." };
  }
  if (vatRateType === "export" && (isDomestic || isEU)) {
    return { valid: false, warning: "Export tarief is alleen voor leveringen buiten de EU." };
  }
  if ((vatRateType === "high" || vatRateType === "low") && isEU && !isDomestic && contact.btw_number) {
    return { valid: false, warning: "Overweeg ICP of BTW verlegd voor deze EU-klant met BTW-nummer." };
  }

  return { valid: true };
}

export function suggestVatTreatment(contact: {
  is_domestic?: boolean | null;
  is_eu?: boolean | null;
  btw_number?: string | null;
  address_country?: string | null;
}): VatRateType {
  const isDomestic = contact.is_domestic ?? contact.address_country === "NL";
  if (isDomestic) return "high";
  const isEU = contact.is_eu ?? false;
  if (isEU && contact.btw_number) return "icp";
  if (isEU && !contact.btw_number) return "high";
  return "export";
}

export { VAT_PERCENTAGES };
