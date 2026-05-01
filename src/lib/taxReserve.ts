import { supabase } from "@/integrations/supabase/client";

export interface TaxReserveSnapshot {
  /** Geboekte BTW saldo over huidige open periode (positief = af te dragen) */
  vatDuePeriod: number;
  /** Periode label (bv. "Q4 2026") */
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  /** Geschatte inkomstenbelasting reserve op YTD-winst (alleen indicatie) */
  incomeTaxEstimate: number;
  /** YTD winst op basis van resultaatrekeningen */
  ytdProfit: number;
  /** Huidige bank/cash positie */
  cashBalance: number;
  /** Reserveer-aanbeveling = vatDuePeriod + incomeTaxEstimate */
  totalReserveRecommended: number;
  /** Cash beschikbaar na reservering */
  safeToSpend: number;
  /** Hoeveel reeds gereserveerd door de gebruiker (tax_reserves) */
  alreadyReserved: number;
  /** Tekort = recommended - alreadyReserved (negatief = ok) */
  shortage: number;
  /** Status: 'ok' | 'low' | 'critical' | 'no-data' */
  status: "ok" | "low" | "critical" | "no-data";
  /** Aantal dagen tot BTW-deadline (NL: 30 dagen na kwartaaleinde) */
  daysToVatDeadline: number;
  vatDeadline: string;
}

const NL_INCOME_TAX_INDICATIVE_RATE = 0.3193; // box 1 eerste schijf 2025 als simpele indicatie

function quarterOf(d: Date) {
  return Math.floor(d.getMonth() / 3) + 1;
}

function quarterRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);
  return { start, end };
}

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

export async function calculateTaxReserve(orgId: string): Promise<TaxReserveSnapshot> {
  const today = new Date();
  const year = today.getFullYear();
  const q = quarterOf(today);
  const { start, end } = quarterRange(year, q);
  const periodStart = fmt(start);
  const periodEnd = fmt(end);

  // BTW deadline: laatste dag maand na kwartaaleinde
  const deadline = new Date(end.getFullYear(), end.getMonth() + 2, 0);
  const daysToDeadline = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);

  // 1) BTW saldo deze periode (vat_payable - vat_receivable) via journal_lines
  const { data: vatLines } = await supabase
    .from("journal_lines")
    .select("vat_amount, vat_box, journal_entries!inner(organization_id, date, status)")
    .eq("journal_entries.organization_id", orgId)
    .eq("journal_entries.status", "posted")
    .gte("journal_entries.date", periodStart)
    .lte("journal_entries.date", periodEnd)
    .not("vat_box", "is", null);

  let vatPayable = 0;
  let vatReceivable = 0;
  (vatLines ?? []).forEach((l: any) => {
    const box = String(l.vat_box ?? "");
    const amt = Number(l.vat_amount ?? 0);
    if (box.startsWith("1") || box.startsWith("2") || box.startsWith("4")) vatPayable += amt;
    if (box === "5b") vatReceivable += amt;
  });
  const vatDuePeriod = Math.max(0, vatPayable - vatReceivable);

  // 2) YTD winst (revenue - expense)
  const ytdStart = `${year}-01-01`;
  const { data: pl } = await supabase
    .from("journal_lines")
    .select("debit_amount, credit_amount, accounts!inner(account_type), journal_entries!inner(organization_id, date, status)")
    .eq("journal_entries.organization_id", orgId)
    .eq("journal_entries.status", "posted")
    .gte("journal_entries.date", ytdStart)
    .lte("journal_entries.date", periodEnd);

  let revenue = 0;
  let expense = 0;
  (pl ?? []).forEach((l: any) => {
    const t = l.accounts?.account_type;
    const debit = Number(l.debit_amount ?? 0);
    const credit = Number(l.credit_amount ?? 0);
    if (t === "revenue") revenue += credit - debit;
    if (t === "expense") expense += debit - credit;
  });
  const ytdProfit = revenue - expense;
  const incomeTaxEstimate = Math.max(0, ytdProfit * NL_INCOME_TAX_INDICATIVE_RATE);

  // 3) Cash positie (bank accounts)
  const { data: banks } = await supabase
    .from("bank_accounts")
    .select("current_balance")
    .eq("organization_id", orgId);
  const cashBalance = (banks ?? []).reduce((s, b: any) => s + Number(b.current_balance ?? 0), 0);

  // 4) Reeds gereserveerd
  const { data: reserves } = await supabase
    .from("tax_reserves")
    .select("calculated_amount, paid_amount, reserve_type, period_year, status")
    .eq("organization_id", orgId)
    .eq("period_year", year)
    .in("status", ["estimated", "confirmed"]);
  const alreadyReserved = (reserves ?? []).reduce(
    (s: number, r: any) => s + Math.max(0, Number(r.calculated_amount ?? 0) - Number(r.paid_amount ?? 0)),
    0
  );

  const totalReserveRecommended = vatDuePeriod + incomeTaxEstimate;
  const safeToSpend = Math.max(0, cashBalance - totalReserveRecommended);
  const shortage = totalReserveRecommended - alreadyReserved;

  let status: TaxReserveSnapshot["status"] = "ok";
  if (vatDuePeriod === 0 && ytdProfit === 0 && cashBalance === 0) status = "no-data";
  else if (shortage > 0 && cashBalance < totalReserveRecommended) status = "critical";
  else if (shortage > 0) status = "low";

  return {
    vatDuePeriod,
    periodLabel: `Q${q} ${year}`,
    periodStart,
    periodEnd,
    incomeTaxEstimate,
    ytdProfit,
    cashBalance,
    totalReserveRecommended,
    safeToSpend,
    alreadyReserved,
    shortage,
    status,
    daysToVatDeadline: daysToDeadline,
    vatDeadline: fmt(deadline),
  };
}

export async function upsertTaxReserve(
  orgId: string,
  reserveType: "vat" | "income_tax",
  year: number,
  amount: number,
  details: Record<string, unknown> = {}
) {
  // Find existing
  const { data: existing } = await supabase
    .from("tax_reserves")
    .select("id")
    .eq("organization_id", orgId)
    .eq("reserve_type", reserveType)
    .eq("period_year", year)
    .is("period_month", null)
    .maybeSingle();

  if (existing) {
    return supabase
      .from("tax_reserves")
      .update({ calculated_amount: amount, calculation_details: details, status: "estimated" })
      .eq("id", existing.id);
  }
  return supabase.from("tax_reserves").insert({
    organization_id: orgId,
    reserve_type: reserveType,
    period_year: year,
    calculated_amount: amount,
    calculation_details: details,
    status: "estimated",
  });
}
