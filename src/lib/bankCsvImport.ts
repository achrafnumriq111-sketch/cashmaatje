import { supabase } from "@/integrations/supabase/client";

/**
 * Parse een CSV-bestand naar bank-transactie kandidaten.
 * Best-effort header detection: zoekt kolommen voor datum, bedrag, omschrijving, tegenpartij.
 * Ondersteunt Nederlandse bank exports (ING, Rabobank, Triodos, ABN, Knab, Bunq, generiek).
 */

export interface ParsedTx {
  transaction_date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  counterparty_name?: string;
  counterparty_iban?: string;
  payment_reference?: string;
  raw: Record<string, string>;
}

export interface ParseResult {
  transactions: ParsedTx[];
  errors: string[];
  detected: {
    delimiter: string;
    headers: string[];
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumn?: string;
  };
}

const DATE_HEADERS = ["datum", "date", "transactiedatum", "boekdatum", "valutadatum"];
const AMOUNT_HEADERS = ["bedrag", "amount", "amount (eur)", "transactiebedrag", "mutatie"];
const DEBIT_CREDIT_HEADERS = ["af bij", "af/bij", "debit/credit", "type", "credit/debit"];
const DESC_HEADERS = ["omschrijving", "description", "mededelingen", "naam / omschrijving", "naam/omschrijving", "tekst", "details"];
const COUNTERPARTY_HEADERS = ["tegenrekening", "naam tegenrekening", "naam", "counterparty", "begunstigde", "naam tegenpartij"];
const IBAN_HEADERS = ["tegenrekening iban", "iban tegenrekening", "tegenrekening", "iban"];
const REF_HEADERS = ["kenmerk", "reference", "referentie", "betalingskenmerk"];

function detectDelimiter(line: string): string {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let max = 0;
  for (const c of candidates) {
    const n = line.split(c).length;
    if (n > max) {
      max = n;
      best = c;
    }
  }
  return best;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

function findHeader(headers: string[], candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const cand of candidates) {
    const idx = lower.findIndex((h) => h === cand);
    if (idx >= 0) return headers[idx];
  }
  // fuzzy contains
  for (const cand of candidates) {
    const idx = lower.findIndex((h) => h.includes(cand));
    if (idx >= 0) return headers[idx];
  }
  return undefined;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim().replace(/['"]/g, "");
  // YYYYMMDD (Rabobank/ING)
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  // YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  // DD-MM-YYYY or DD/MM/YYYY
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function parseAmount(raw: string, debitCredit?: string): number | null {
  if (!raw) return null;
  let s = raw.trim().replace(/['"€\s]/g, "");
  // NL format: 1.234,56 → 1234.56
  if (/,\d{1,2}$/.test(s) && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/,\d{1,2}$/.test(s)) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  // ING/Rabo style: separate Af/Bij column
  if (debitCredit) {
    const dc = debitCredit.toLowerCase().trim();
    if (dc === "af" || dc === "debit" || dc === "d") return -Math.abs(n);
    if (dc === "bij" || dc === "credit" || dc === "c") return Math.abs(n);
  }
  return n;
}

export function parseBankCsv(text: string): ParseResult {
  const errors: string[] = [];
  // Strip BOM
  text = text.replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { transactions: [], errors: ["CSV bevat geen data"], detected: { delimiter: ",", headers: [] } };
  }
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.replace(/^"|"$/g, ""));

  const dateCol = findHeader(headers, DATE_HEADERS);
  const amountCol = findHeader(headers, AMOUNT_HEADERS);
  const dcCol = findHeader(headers, DEBIT_CREDIT_HEADERS);
  const descCol = findHeader(headers, DESC_HEADERS);
  const counterCol = findHeader(headers, COUNTERPARTY_HEADERS);
  const ibanCol = findHeader(headers, IBAN_HEADERS);
  const refCol = findHeader(headers, REF_HEADERS);

  if (!dateCol) errors.push("Geen datum-kolom gevonden");
  if (!amountCol) errors.push("Geen bedrag-kolom gevonden");

  const transactions: ParsedTx[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter).map((c) => c.replace(/^"|"$/g, ""));
    if (cells.length < 2) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });

    const date = dateCol ? parseDate(row[dateCol]) : null;
    const amount = amountCol ? parseAmount(row[amountCol], dcCol ? row[dcCol] : undefined) : null;
    if (!date || amount === null) {
      errors.push(`Rij ${i + 1}: kon datum of bedrag niet lezen`);
      continue;
    }

    transactions.push({
      transaction_date: date,
      amount,
      description: descCol ? row[descCol] : "",
      counterparty_name: counterCol ? row[counterCol] : undefined,
      counterparty_iban: ibanCol ? row[ibanCol] : undefined,
      payment_reference: refCol ? row[refCol] : undefined,
      raw: row,
    });
  }

  return {
    transactions,
    errors,
    detected: {
      delimiter,
      headers,
      dateColumn: dateCol,
      amountColumn: amountCol,
      descriptionColumn: descCol,
    },
  };
}

export interface ImportResult {
  inserted: number;
  duplicates: number;
  matched: number;
  errors: string[];
}

/**
 * Importeer geparseerde transacties + probeer matchen tegen openstaande facturen.
 *
 * `contactResolver` mapt een transactie naar een contact_id (na de sort/match-stap).
 */
export async function importBankTransactions(
  orgId: string,
  bankAccountId: string,
  txs: ParsedTx[],
  contactResolver?: (tx: ParsedTx) => string | null,
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, duplicates: 0, matched: 0, errors: [] };
  if (!txs.length) return result;

  // Haal openstaande facturen op voor matching
  const { data: openInvoices } = await supabase
    .from("invoices")
    .select("id, invoice_type, invoice_number, total_amount, amount_paid, contact_name, payment_reference")
    .eq("organization_id", orgId)
    .neq("status", "paid")
    .neq("status", "cancelled");

  // Bestaande hashes voor dedup
  const hashes = txs.map(
    (t) => `${t.transaction_date}|${t.amount.toFixed(2)}|${(t.description || "").slice(0, 50)}`,
  );
  const { data: existing } = await supabase
    .from("bank_transactions")
    .select("transaction_hash")
    .eq("organization_id", orgId)
    .in("transaction_hash", hashes);
  const existingSet = new Set((existing ?? []).map((e: any) => e.transaction_hash));

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const hash = hashes[i];
    if (existingSet.has(hash)) {
      result.duplicates++;
      continue;
    }

    // Probeer match
    let matchedInvoiceId: string | null = null;
    let matchConfidence: number | null = null;
    let matchedContact: string | null = null;
    if (openInvoices) {
      for (const inv of openInvoices as any[]) {
        const due = Number(inv.total_amount) - Number(inv.amount_paid || 0);
        const isInflow = tx.amount > 0;
        const wantsInflow = inv.invoice_type === "sales";
        if (isInflow !== wantsInflow) continue;
        if (Math.abs(Math.abs(tx.amount) - due) > 0.01) continue;

        // Prefer reference / invoice number match
        const ref = (tx.payment_reference || tx.description || "").toLowerCase();
        if (ref.includes(String(inv.invoice_number).toLowerCase())) {
          matchedInvoiceId = inv.id;
          matchConfidence = 0.95;
          matchedContact = inv.contact_name;
          break;
        }
        // Fallback: contact name match
        if (
          inv.contact_name &&
          tx.counterparty_name &&
          tx.counterparty_name.toLowerCase().includes(String(inv.contact_name).toLowerCase().split(" ")[0])
        ) {
          matchedInvoiceId = inv.id;
          matchConfidence = 0.7;
          matchedContact = inv.contact_name;
          break;
        }
      }
    }

    const { error } = await supabase.from("bank_transactions").insert({
      organization_id: orgId,
      bank_account_id: bankAccountId,
      transaction_date: tx.transaction_date,
      value_date: tx.transaction_date,
      amount: tx.amount,
      currency: "EUR",
      description: tx.description,
      counterparty_name: tx.counterparty_name ?? matchedContact,
      counterparty_iban: tx.counterparty_iban,
      payment_reference: tx.payment_reference,
      status: matchedInvoiceId ? "matched" : "new",
      matched_invoice_id: matchedInvoiceId,
      match_confidence: matchConfidence,
      match_method: matchedInvoiceId ? "csv_import_auto" : null,
      transaction_hash: hash,
      raw_data: tx.raw,
    });

    if (error) {
      result.errors.push(`Rij ${i + 1}: ${error.message}`);
    } else {
      result.inserted++;
      if (matchedInvoiceId) result.matched++;
    }
  }

  return result;
}
