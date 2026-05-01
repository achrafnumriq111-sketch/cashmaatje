import { supabase } from "@/integrations/supabase/client";

export interface HealthMetric {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number;
  status: "good" | "warn" | "bad";
  detail: string;
}

export interface HealthSnapshot {
  overall: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  metrics: HealthMetric[];
  computedAt: string;
}

function gradeFor(score: number): HealthSnapshot["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function statusFor(score: number): HealthMetric["status"] {
  if (score >= 75) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

/**
 * Bereken een 0-100 financiële gezondheidsscore op basis van 5 sub-metrics:
 * 1. Cash runway (saldo / gemiddelde maandkosten)
 * 2. BTW-reservering (heeft de gebruiker genoeg apart staan)
 * 3. Debiteuren on-time (% facturen die op tijd betaald worden)
 * 4. Categorisatie-discipline (% transacties met grootboek)
 * 5. Winstmarge YTD
 */
export async function calculateHealthScore(orgId: string): Promise<HealthSnapshot> {
  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1).toISOString().slice(0, 10);

  const [banksRes, salesRes, purchasesRes, openInvRes, txRes] = await Promise.all([
    supabase.from("bank_accounts").select("current_balance").eq("organization_id", orgId).eq("is_active", true),
    supabase.from("invoices").select("total_amount, total_vat, status, paid_date, due_date, invoice_date, amount_paid")
      .eq("organization_id", orgId).eq("invoice_type", "sales").gte("invoice_date", yearStart),
    supabase.from("invoices").select("total_amount, total_vat")
      .eq("organization_id", orgId).eq("invoice_type", "purchase").gte("invoice_date", yearStart),
    supabase.from("invoices").select("amount_paid, total_amount, due_date")
      .eq("organization_id", orgId).eq("invoice_type", "sales").neq("status", "paid").neq("status", "cancelled"),
    supabase.from("bank_transactions").select("status, account_id")
      .eq("organization_id", orgId).gte("transaction_date", oneYearAgo).limit(1000),
  ]);

  const banks = banksRes.data ?? [];
  const sales = salesRes.data ?? [];
  const purchases = purchasesRes.data ?? [];
  const openInv = openInvRes.data ?? [];
  const txs = txRes.data ?? [];

  const cash = banks.reduce((s: number, b: any) => s + Number(b.current_balance || 0), 0);
  const ytdRevenue = sales.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
  const ytdSpend = purchases.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
  const ytdProfit = ytdRevenue - ytdSpend;
  const monthsElapsed = Math.max(1, today.getMonth() + 1);
  const monthlySpend = ytdSpend / monthsElapsed;

  // 1. Cash Runway — runway in maanden
  const runway = monthlySpend > 0 ? cash / monthlySpend : cash > 0 ? 12 : 0;
  const runwayScore = Math.min(100, Math.round((runway / 6) * 100)); // 6+ maanden = perfect
  const runwayMetric: HealthMetric = {
    key: "runway",
    label: "Cash runway",
    score: runwayScore,
    weight: 0.25,
    status: statusFor(runwayScore),
    detail:
      monthlySpend > 0
        ? `${runway.toFixed(1)} maanden buffer (€${Math.round(cash).toLocaleString("nl-NL")} / €${Math.round(monthlySpend).toLocaleString("nl-NL")} per maand)`
        : "Nog geen kostenpatroon — score gebaseerd op cash positie",
  };

  // 2. BTW reservering — vereenvoudigde versie: cash >= openstaande BTW
  const vatPayable = sales.reduce((s: number, i: any) => s + Number(i.total_vat || 0), 0);
  const vatReceivable = purchases.reduce((s: number, i: any) => s + Number(i.total_vat || 0), 0);
  const vatBalance = Math.max(0, vatPayable - vatReceivable);
  const vatRatio = vatBalance > 0 ? Math.min(1, cash / (vatBalance * 1.5)) : 1;
  const vatScore = Math.round(vatRatio * 100);
  const vatMetric: HealthMetric = {
    key: "vat",
    label: "BTW-reserve",
    score: vatScore,
    weight: 0.2,
    status: statusFor(vatScore),
    detail: `BTW saldo €${Math.round(vatBalance).toLocaleString("nl-NL")} · cash €${Math.round(cash).toLocaleString("nl-NL")}`,
  };

  // 3. Debiteuren on-time — % facturen met paid_date <= due_date
  const paid = sales.filter((i: any) => i.status === "paid" && i.paid_date && i.due_date);
  const onTime = paid.filter((i: any) => new Date(i.paid_date) <= new Date(i.due_date)).length;
  const ontimeScore = paid.length === 0 ? 75 : Math.round((onTime / paid.length) * 100);
  const overdueAmt = openInv
    .filter((i: any) => i.due_date && new Date(i.due_date) < today)
    .reduce((s: number, i: any) => s + (Number(i.total_amount) - Number(i.amount_paid || 0)), 0);
  const ontimeMetric: HealthMetric = {
    key: "ontime",
    label: "Debiteurenbetaling",
    score: ontimeScore,
    weight: 0.2,
    status: statusFor(ontimeScore),
    detail:
      paid.length > 0
        ? `${onTime}/${paid.length} op tijd betaald · €${Math.round(overdueAmt).toLocaleString("nl-NL")} achterstallig`
        : "Nog geen betalingsgeschiedenis",
  };

  // 4. Categorisatie-discipline
  const categorized = txs.filter((t: any) => t.account_id || ["matched", "manually_matched", "reconciled", "excluded"].includes(t.status)).length;
  const catScore = txs.length === 0 ? 100 : Math.round((categorized / txs.length) * 100);
  const catMetric: HealthMetric = {
    key: "categorization",
    label: "Categorisatie",
    score: catScore,
    weight: 0.15,
    status: statusFor(catScore),
    detail:
      txs.length > 0
        ? `${categorized}/${txs.length} transacties verwerkt`
        : "Geen banktransacties geïmporteerd",
  };

  // 5. Winstmarge
  const margin = ytdRevenue > 0 ? (ytdProfit / ytdRevenue) * 100 : 0;
  // Doel: 20% marge = 100, 0% = 50, negatief = 0
  const marginScore = Math.max(0, Math.min(100, Math.round(50 + margin * 2.5)));
  const marginMetric: HealthMetric = {
    key: "margin",
    label: "Winstmarge",
    score: marginScore,
    weight: 0.2,
    status: statusFor(marginScore),
    detail:
      ytdRevenue > 0
        ? `${margin.toFixed(1)}% marge · YTD winst €${Math.round(ytdProfit).toLocaleString("nl-NL")}`
        : "Nog geen omzet dit jaar",
  };

  const metrics = [runwayMetric, vatMetric, ontimeMetric, catMetric, marginMetric];
  const overall = Math.round(metrics.reduce((s, m) => s + m.score * m.weight, 0));
  return {
    overall,
    grade: gradeFor(overall),
    metrics,
    computedAt: new Date().toISOString(),
  };
}
