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

// VAT box mapping for sales invoices
const SALES_VAT_BOX_MAP: Record<string, string> = {
  high: "1a",
  low: "1b",
  zero: "1c",
  reverse_charge: "1e",
  icp: "3b",
  export: "3a",
  exempt: "",
  import: "4a",
};

// VAT box mapping for purchase invoices (voorbelasting = box 5b)
const PURCHASE_VAT_BOX_MAP: Record<string, string> = {
  high: "5b",
  low: "5b",
  zero: "",
  reverse_charge: "5b",
  icp: "5b",
  import: "5b",
  exempt: "",
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
      if (!orgId) throw new Error("Geen organisatie geselecteerd");
      if (!input.lines || input.lines.length === 0) {
        throw new Error("Voeg minimaal één regel toe");
      }

      // Get the current user (for created_by + audit)
      const { data: userResult } = await supabase.auth.getUser();
      const userId = userResult?.user?.id ?? null;

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

      const totalAmount = Math.round((subtotal + totalVat) * 100) / 100;

      // Generate invoice number BEFORE insert (unique constraint requires non-empty unique value)
      const prefix = input.invoice_type === "sales" ? "VK" : "IK";
      const year = new Date(input.invoice_date).getFullYear();
      const { count: existingCount } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("invoice_type", input.invoice_type)
        .gte("invoice_date", `${year}-01-01`)
        .lte("invoice_date", `${year}-12-31`);

      // Try a few times in case of race
      let invoice: { id: string } | null = null;
      let invoiceNumber = "";
      let lastErr: { message?: string; code?: string } | null = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        invoiceNumber = `${prefix}${year}-${String((existingCount ?? 0) + 1 + attempt).padStart(4, "0")}`;
        const { data, error } = await supabase
          .from("invoices")
          .insert({
            organization_id: orgId,
            invoice_number: invoiceNumber,
            invoice_type: input.invoice_type,
            status: input.status === "sent" ? "sent" : "draft",
            contact_id: input.contact_id,
            contact_name: input.contact_name,
            invoice_date: input.invoice_date,
            due_date: input.due_date,
            subtotal: Math.round(subtotal * 100) / 100,
            total_vat: Math.round(totalVat * 100) / 100,
            total_amount: totalAmount,
            amount_due: totalAmount,
            amount_paid: 0,
            currency: "EUR",
            created_by: userId,
            notes: input.notes || null,
            vat_summary: Object.entries(vatSummary).map(([type, v]) => ({
              rate_type: type,
              percentage: v.percentage,
              base: Math.round(v.base * 100) / 100,
              vat: Math.round(v.vat * 100) / 100,
            })),
          })
          .select("id")
          .single();

        if (!error && data) {
          invoice = data;
          break;
        }
        lastErr = error;
        // Only retry on unique violation
        if (error?.code !== "23505") break;
      }

      if (!invoice) {
        throw new Error(lastErr?.message ?? "Factuur kon niet worden opgeslagen");
      }

      // Create invoice lines
      const lineInserts = processedLines.map((l) => ({
        invoice_id: invoice!.id,
        line_number: l.lineNumber,
        description: l.description,
        quantity: l.quantity,
        unit_price: Math.round(l.unit_price * 100) / 100,
        vat_rate_type: l.vat_rate_type,
        vat_percentage: l.vat_percentage,
        vat_amount: Math.round(l.vatAmount * 100) / 100,
        line_total: Math.round(l.lineTotal * 100) / 100,
      }));

      const { error: lineErr } = await supabase.from("invoice_lines").insert(lineInserts);
      if (lineErr) {
        // Roll back the invoice so we don't leave orphans
        await supabase.from("invoices").delete().eq("id", invoice.id);
        throw new Error("Regels konden niet worden opgeslagen: " + lineErr.message);
      }

      // If status is "sent", create journal entries (best effort — don't block save if it fails)
      if (input.status === "sent") {
        try {
          await createJournalFromInvoice(orgId, invoice.id, input, processedLines, subtotal, totalVat, totalAmount);
        } catch (e) {
          console.error("Journal entry creation failed:", e);
        }
      }

      return { ...invoice, invoice_number: invoiceNumber };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["next-invoice-number"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

/**
 * Creates a balanced journal entry from an invoice.
 * 
 * SALES INVOICE:
 *   Debit  1300 Debiteuren     (total incl. VAT)
 *   Credit 4xxx Omzet          (subtotal per revenue account)
 *   Credit 2310/2320 BTW       (VAT amount per rate)
 * 
 * PURCHASE INVOICE:
 *   Debit  7xxx Kosten         (subtotal per expense account)
 *   Debit  1510/1520 BTW voorbelasting (VAT amount per rate)
 *   Credit 2100 Crediteuren    (total incl. VAT)
 */
async function createJournalFromInvoice(
  orgId: string,
  invoiceId: string,
  input: CreateInvoiceInput,
  lines: Array<InvoiceLineInput & { lineTotal: number; vatAmount: number; lineNumber: number }>,
  subtotal: number,
  totalVat: number,
  totalAmount: number
) {
  const isSales = input.invoice_type === "sales";

  // Determine the counterparty account (debiteuren for sales, crediteuren for purchase)
  const counterpartyCode = isSales ? "1300" : "2100";
  const { data: counterpartyAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("code", counterpartyCode)
    .single();

  if (!counterpartyAccount) return;

  // Map vat_rate_type → revenue/expense account codes
  const revenueCodeMap: Record<string, string> = {
    high: "4200",
    low: "4200",
    zero: "4200",
    exempt: "4200",
    reverse_charge: "4500",
    icp: "4300",
    export: "4400",
  };

  const expenseCodeMap: Record<string, string> = {
    high: "7600",
    low: "7600",
    zero: "7600",
    exempt: "7600",
    reverse_charge: "7600",
    icp: "7600",
    import: "7600",
  };

  // Sales: BTW af te dragen (liability), Purchase: BTW voorbelasting (asset)
  const salesVatCodeMap: Record<string, string> = {
    high: "2310",
    low: "2320",
    reverse_charge: "2330",
  };
  const purchaseVatCodeMap: Record<string, string> = {
    high: "1510",
    low: "1520",
    reverse_charge: "1530",
    import: "1540",
    icp: "1530",
  };

  const accountCodeMap = isSales ? revenueCodeMap : expenseCodeMap;
  const vatCodeMap = isSales ? salesVatCodeMap : purchaseVatCodeMap;
  const vatBoxMap = isSales ? SALES_VAT_BOX_MAP : PURCHASE_VAT_BOX_MAP;

  // Resolve account IDs
  const accountIds: Record<string, string> = {};
  const codesToResolve = new Set<string>([counterpartyCode]);

  for (const line of lines) {
    codesToResolve.add(accountCodeMap[line.vat_rate_type] || (isSales ? "4200" : "7600"));
    if (line.vatAmount > 0) {
      const vc = vatCodeMap[line.vat_rate_type];
      if (vc) codesToResolve.add(vc);
    }
  }

  const { data: resolvedAccounts } = await supabase
    .from("accounts")
    .select("id, code")
    .eq("organization_id", orgId)
    .in("code", Array.from(codesToResolve));

  for (const a of resolvedAccounts ?? []) {
    accountIds[a.code] = a.id;
  }

  // Create journal entry
  const { data: entry, error: entryErr } = await supabase
    .from("journal_entries")
    .insert({
      organization_id: orgId,
      date: input.invoice_date,
      description: `${isSales ? "Verkoopfactuur" : "Inkoopfactuur"} ${input.contact_name}`,
      status: "posted",
      source_type: "invoice",
      source_id: invoiceId,
      posted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (entryErr || !entry) return;

  // Link journal entry to invoice
  await supabase.from("invoices").update({ journal_entry_id: entry.id }).eq("id", invoiceId);

  // Build journal lines
  const journalLines: Database["public"]["Tables"]["journal_lines"]["Insert"][] = [];
  let lineNum = 1;

  // Aggregate amounts by account code
  const amountByCode: Record<string, number> = {};
  const vatByCode: Record<string, { amount: number; rateType: string; percentage: number; box: string }> = {};

  for (const line of lines) {
    const code = accountCodeMap[line.vat_rate_type] || (isSales ? "4200" : "7600");
    amountByCode[code] = (amountByCode[code] || 0) + line.lineTotal;

    if (line.vatAmount > 0) {
      const vatCode = vatCodeMap[line.vat_rate_type];
      if (vatCode) {
        if (!vatByCode[vatCode]) {
          vatByCode[vatCode] = {
            amount: 0,
            rateType: line.vat_rate_type,
            percentage: line.vat_percentage,
            box: vatBoxMap[line.vat_rate_type] || "",
          };
        }
        vatByCode[vatCode].amount += line.vatAmount;
      }
    }
  }

  if (isSales) {
    // SALES: Debit debiteuren, Credit omzet + BTW
    journalLines.push({
      journal_entry_id: entry.id,
      line_number: lineNum++,
      account_id: accountIds[counterpartyCode],
      debit_amount: totalAmount,
      credit_amount: 0,
      description: `Debiteuren - ${input.contact_name}`,
      contact_id: input.contact_id,
      invoice_id: invoiceId,
    });

    for (const [code, amount] of Object.entries(amountByCode)) {
      if (accountIds[code]) {
        journalLines.push({
          journal_entry_id: entry.id,
          line_number: lineNum++,
          account_id: accountIds[code],
          debit_amount: 0,
          credit_amount: amount,
          description: `Omzet`,
        });
      }
    }

    for (const [code, info] of Object.entries(vatByCode)) {
      if (accountIds[code]) {
        journalLines.push({
          journal_entry_id: entry.id,
          line_number: lineNum++,
          account_id: accountIds[code],
          debit_amount: 0,
          credit_amount: info.amount,
          description: `BTW ${info.percentage}%`,
          vat_rate_type: info.rateType as VatRateType,
          vat_percentage: info.percentage,
          vat_amount: info.amount,
          vat_box: info.box || null,
        });
      }
    }
  } else {
    // PURCHASE: Debit kosten + BTW voorbelasting, Credit crediteuren
    for (const [code, amount] of Object.entries(amountByCode)) {
      if (accountIds[code]) {
        journalLines.push({
          journal_entry_id: entry.id,
          line_number: lineNum++,
          account_id: accountIds[code],
          debit_amount: amount,
          credit_amount: 0,
          description: `Kosten`,
          contact_id: input.contact_id,
          invoice_id: invoiceId,
        });
      }
    }

    for (const [code, info] of Object.entries(vatByCode)) {
      if (accountIds[code]) {
        journalLines.push({
          journal_entry_id: entry.id,
          line_number: lineNum++,
          account_id: accountIds[code],
          debit_amount: info.amount,
          credit_amount: 0,
          description: `BTW voorbelasting ${info.percentage}%`,
          vat_rate_type: info.rateType as VatRateType,
          vat_percentage: info.percentage,
          vat_amount: info.amount,
          vat_box: info.box || null,
        });
      }
    }

    journalLines.push({
      journal_entry_id: entry.id,
      line_number: lineNum++,
      account_id: accountIds[counterpartyCode],
      debit_amount: 0,
      credit_amount: totalAmount,
      description: `Crediteuren - ${input.contact_name}`,
      contact_id: input.contact_id,
      invoice_id: invoiceId,
    });
  }

  await supabase.from("journal_lines").insert(journalLines);
}

/**
 * Creates a payment journal entry when a bank transaction is matched to an invoice.
 * 
 * SALES PAYMENT (inbound):
 *   Debit  1120 Bank
 *   Credit 1300 Debiteuren
 * 
 * PURCHASE PAYMENT (outbound):
 *   Debit  2100 Crediteuren
 *   Credit 1120 Bank
 */
export async function createPaymentJournalEntry(
  orgId: string,
  transactionId: string,
  invoiceId: string,
  amount: number,
  transactionDate: string,
  contactName: string,
  contactId: string | null,
  invoiceType: "sales" | "purchase"
) {
  const bankCode = "1120";
  const counterpartyCode = invoiceType === "sales" ? "1300" : "2100";

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, code")
    .eq("organization_id", orgId)
    .in("code", [bankCode, counterpartyCode]);

  const accountIds: Record<string, string> = {};
  for (const a of accounts ?? []) {
    accountIds[a.code] = a.id;
  }

  if (!accountIds[bankCode] || !accountIds[counterpartyCode]) return;

  const absAmount = Math.abs(amount);

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({
      organization_id: orgId,
      date: transactionDate,
      description: `Betaling ${contactName}`,
      status: "posted",
      source_type: "bank_transaction",
      source_id: transactionId,
      posted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !entry) return;

  // Link journal entry to bank transaction
  await supabase
    .from("bank_transactions")
    .update({ journal_entry_id: entry.id })
    .eq("id", transactionId);

  const journalLines: Database["public"]["Tables"]["journal_lines"]["Insert"][] = [];

  if (invoiceType === "sales") {
    // Inbound payment: Debit Bank, Credit Debiteuren
    journalLines.push({
      journal_entry_id: entry.id,
      line_number: 1,
      account_id: accountIds[bankCode],
      debit_amount: absAmount,
      credit_amount: 0,
      description: `Ontvangst - ${contactName}`,
      bank_transaction_id: transactionId,
    });
    journalLines.push({
      journal_entry_id: entry.id,
      line_number: 2,
      account_id: accountIds[counterpartyCode],
      debit_amount: 0,
      credit_amount: absAmount,
      description: `Afboeking debiteuren - ${contactName}`,
      contact_id: contactId,
      invoice_id: invoiceId,
    });
  } else {
    // Outbound payment: Debit Crediteuren, Credit Bank
    journalLines.push({
      journal_entry_id: entry.id,
      line_number: 1,
      account_id: accountIds[counterpartyCode],
      debit_amount: absAmount,
      credit_amount: 0,
      description: `Afboeking crediteuren - ${contactName}`,
      contact_id: contactId,
      invoice_id: invoiceId,
    });
    journalLines.push({
      journal_entry_id: entry.id,
      line_number: 2,
      account_id: accountIds[bankCode],
      debit_amount: 0,
      credit_amount: absAmount,
      description: `Betaling - ${contactName}`,
      bank_transaction_id: transactionId,
    });
  }

  await supabase.from("journal_lines").insert(journalLines);
  return entry.id;
}

/**
 * Creates a journal entry for a directly booked bank transaction (no invoice).
 * 
 * Positive amount (inbound):
 *   Debit  1120 Bank
 *   Credit <selected account>
 * 
 * Negative amount (outbound):
 *   Debit  <selected account>
 *   Credit 1120 Bank
 */
export async function createDirectBookingJournalEntry(
  orgId: string,
  transactionId: string,
  accountId: string,
  amount: number,
  transactionDate: string,
  description: string
) {
  const bankCode = "1120";

  const { data: bankAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("code", bankCode)
    .single();

  if (!bankAccount) return;

  const absAmount = Math.abs(amount);
  const isInbound = amount > 0;

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({
      organization_id: orgId,
      date: transactionDate,
      description: description || "Directe boeking",
      status: "posted",
      source_type: "bank_transaction",
      source_id: transactionId,
      posted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !entry) return;

  await supabase
    .from("bank_transactions")
    .update({ journal_entry_id: entry.id })
    .eq("id", transactionId);

  const journalLines: Database["public"]["Tables"]["journal_lines"]["Insert"][] = [];

  if (isInbound) {
    journalLines.push({
      journal_entry_id: entry.id,
      line_number: 1,
      account_id: bankAccount.id,
      debit_amount: absAmount,
      credit_amount: 0,
      description: `Bank ontvangst`,
      bank_transaction_id: transactionId,
    });
    journalLines.push({
      journal_entry_id: entry.id,
      line_number: 2,
      account_id: accountId,
      debit_amount: 0,
      credit_amount: absAmount,
      description: description || "Directe boeking",
    });
  } else {
    journalLines.push({
      journal_entry_id: entry.id,
      line_number: 1,
      account_id: accountId,
      debit_amount: absAmount,
      credit_amount: 0,
      description: description || "Directe boeking",
    });
    journalLines.push({
      journal_entry_id: entry.id,
      line_number: 2,
      account_id: bankAccount.id,
      debit_amount: 0,
      credit_amount: absAmount,
      description: `Bank betaling`,
      bank_transaction_id: transactionId,
    });
  }

  await supabase.from("journal_lines").insert(journalLines);
  return entry.id;
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
