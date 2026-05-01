import { supabase } from "@/integrations/supabase/client";

export interface ForecastPoint {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulative: number;
}

export interface ForecastSummary {
  horizonDays: 30 | 60 | 90;
  startBalance: number;
  endBalance: number;
  totalInflow: number;
  totalOutflow: number;
  expectedReceivables: number;
  expectedPayables: number;
  recurringExpenses: number;
  vatObligation: number;
  lowestPoint: { date: string; balance: number };
  riskOfShortage: boolean;
  shortageDate?: string;
  points: ForecastPoint[];
}

const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export async function buildCashflowForecast(orgId: string, horizonDays: 30 | 60 | 90 = 30): Promise<ForecastSummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizonEnd = addDays(today, horizonDays);

  // Start balance from bank accounts
  const { data: banks } = await supabase
    .from("bank_accounts")
    .select("current_balance")
    .eq("organization_id", orgId);
  const startBalance = (banks ?? []).reduce((s: number, b: any) => s + Number(b.current_balance ?? 0), 0);

  // Open invoices — receivables (sales)
  const { data: receivables } = await supabase
    .from("invoices")
    .select("amount_due, due_date")
    .eq("organization_id", orgId)
    .eq("invoice_type", "sales")
    .gt("amount_due", 0)
    .not("due_date", "is", null);

  // Open invoices — payables (purchase)
  const { data: payables } = await supabase
    .from("invoices")
    .select("amount_due, due_date")
    .eq("organization_id", orgId)
    .eq("invoice_type", "purchase")
    .gt("amount_due", 0)
    .not("due_date", "is", null);

  // Recurring patterns (expected outflows from detected recurring expenses)
  const { data: recurring } = await supabase
    .from("recurring_patterns")
    .select("typical_amount, frequency, next_expected_date, is_active")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .not("typical_amount", "is", null);

  // Recurring invoice templates (expected inflows from recurring sales)
  const { data: recurringInv } = await supabase
    .from("recurring_invoice_templates")
    .select("total_amount, next_run_date, frequency, is_active, invoice_type")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  // VAT obligation if deadline falls in horizon
  const yr = today.getFullYear();
  const q = Math.floor(today.getMonth() / 3) + 1;
  const qEnd = new Date(yr, q * 3, 0);
  const vatDeadline = new Date(qEnd.getFullYear(), qEnd.getMonth() + 2, 0);
  let vatObligation = 0;
  if (vatDeadline >= today && vatDeadline <= horizonEnd) {
    const { data: vatLines } = await supabase
      .from("journal_lines")
      .select("vat_amount, vat_box, journal_entries!inner(organization_id, date, status)")
      .eq("journal_entries.organization_id", orgId)
      .eq("journal_entries.status", "posted")
      .gte("journal_entries.date", fmt(new Date(yr, (q - 1) * 3, 1)))
      .lte("journal_entries.date", fmt(qEnd))
      .not("vat_box", "is", null);
    let pay = 0;
    let rec = 0;
    (vatLines ?? []).forEach((l: any) => {
      const box = String(l.vat_box ?? "");
      const amt = Number(l.vat_amount ?? 0);
      if (box.startsWith("1") || box.startsWith("2") || box.startsWith("4")) pay += amt;
      if (box === "5b") rec += amt;
    });
    vatObligation = Math.max(0, pay - rec);
  }

  // Build daily points
  const dailyMap: Record<string, { inflow: number; outflow: number }> = {};
  const ensure = (key: string) => {
    if (!dailyMap[key]) dailyMap[key] = { inflow: 0, outflow: 0 };
    return dailyMap[key];
  };

  let expectedReceivables = 0;
  (receivables ?? []).forEach((r: any) => {
    const d = new Date(r.due_date);
    if (d < today) d.setTime(today.getTime()); // overdue → assume today
    if (d <= horizonEnd) {
      const k = fmt(d);
      const amt = Number(r.amount_due ?? 0);
      ensure(k).inflow += amt;
      expectedReceivables += amt;
    }
  });

  let expectedPayables = 0;
  (payables ?? []).forEach((p: any) => {
    const d = new Date(p.due_date);
    if (d < today) d.setTime(today.getTime());
    if (d <= horizonEnd) {
      const k = fmt(d);
      const amt = Number(p.amount_due ?? 0);
      ensure(k).outflow += amt;
      expectedPayables += amt;
    }
  });

  // Recurring expense projections
  let recurringExpenses = 0;
  (recurring ?? []).forEach((r: any) => {
    if (!r.next_expected_date) return;
    const next = new Date(r.next_expected_date);
    const amt = Math.abs(Number(r.typical_amount ?? 0));
    let cursor = next < today ? new Date(today) : next;
    while (cursor <= horizonEnd) {
      ensure(fmt(cursor)).outflow += amt;
      recurringExpenses += amt;
      // advance based on frequency
      if (r.frequency === "weekly") cursor = addDays(cursor, 7);
      else if (r.frequency === "biweekly") cursor = addDays(cursor, 14);
      else if (r.frequency === "monthly") cursor = addDays(cursor, 30);
      else if (r.frequency === "quarterly") cursor = addDays(cursor, 90);
      else if (r.frequency === "yearly") cursor = addDays(cursor, 365);
      else break;
    }
  });

  // Recurring sales template projections
  (recurringInv ?? []).forEach((r: any) => {
    if (!r.next_run_date) return;
    const next = new Date(r.next_run_date);
    const amt = Number(r.total_amount ?? 0);
    let cursor = next < today ? new Date(today) : next;
    while (cursor <= horizonEnd) {
      const isInflow = r.invoice_type === "sales";
      if (isInflow) {
        // assume payment 14 days after invoice
        const payDate = addDays(cursor, 14);
        if (payDate <= horizonEnd) {
          ensure(fmt(payDate)).inflow += amt;
          expectedReceivables += amt;
        }
      } else {
        ensure(fmt(cursor)).outflow += amt;
        expectedPayables += amt;
      }
      if (r.frequency === "monthly") cursor = addDays(cursor, 30);
      else if (r.frequency === "quarterly") cursor = addDays(cursor, 90);
      else if (r.frequency === "yearly") cursor = addDays(cursor, 365);
      else break;
    }
  });

  // VAT on deadline
  if (vatObligation > 0) {
    ensure(fmt(vatDeadline)).outflow += vatObligation;
  }

  // Build cumulative timeline
  const points: ForecastPoint[] = [];
  let cum = startBalance;
  let lowest = { date: fmt(today), balance: startBalance };
  let shortageDate: string | undefined;
  for (let i = 0; i <= horizonDays; i++) {
    const d = addDays(today, i);
    const k = fmt(d);
    const day = dailyMap[k] ?? { inflow: 0, outflow: 0 };
    const net = day.inflow - day.outflow;
    cum += net;
    points.push({ date: k, inflow: day.inflow, outflow: day.outflow, net, cumulative: cum });
    if (cum < lowest.balance) lowest = { date: k, balance: cum };
    if (cum < 0 && !shortageDate) shortageDate = k;
  }

  const totalInflow = points.reduce((s, p) => s + p.inflow, 0);
  const totalOutflow = points.reduce((s, p) => s + p.outflow, 0);

  return {
    horizonDays,
    startBalance,
    endBalance: cum,
    totalInflow,
    totalOutflow,
    expectedReceivables,
    expectedPayables,
    recurringExpenses,
    vatObligation,
    lowestPoint: lowest,
    riskOfShortage: !!shortageDate,
    shortageDate,
    points,
  };
}

export function buildForecastInsight(f: ForecastSummary): string {
  const fmtEur = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const horizon = f.horizonDays;
  const delta = f.endBalance - f.startBalance;

  if (f.riskOfShortage && f.shortageDate) {
    return `⚠️ Cashtekort verwacht rond ${f.shortageDate}. Op het laagste punt (${f.lowestPoint.date}) zak je naar ${fmtEur(f.lowestPoint.balance)}. Overweeg een betalingstermijn te verlengen of een vordering te innen.`;
  }
  if (delta > 0) {
    return `Komende ${horizon} dagen verwacht je ${fmtEur(delta)} extra cash. ${fmtEur(f.expectedReceivables)} aan vorderingen tegenover ${fmtEur(f.expectedPayables)} aan kosten${f.vatObligation > 0 ? ` + ${fmtEur(f.vatObligation)} BTW-afdracht` : ""}.`;
  }
  if (delta < 0) {
    return `Verwachte daling van ${fmtEur(Math.abs(delta))} in ${horizon} dagen. ${fmtEur(f.expectedPayables)} aan kosten${f.vatObligation > 0 ? ` + ${fmtEur(f.vatObligation)} BTW` : ""} tegenover ${fmtEur(f.expectedReceivables)} aan inkomsten. Laagste punt: ${fmtEur(f.lowestPoint.balance)} op ${f.lowestPoint.date}.`;
  }
  return `Cashflow stabiel: start ${fmtEur(f.startBalance)}, eind ${fmtEur(f.endBalance)} over ${horizon} dagen.`;
}
