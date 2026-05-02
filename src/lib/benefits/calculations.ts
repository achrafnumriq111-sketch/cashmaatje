/**
 * Toeslagberekeningen 2026 (indicatief).
 * Bronnen: Belastingdienst.nl/toeslagen, herzieningen jan 2026.
 * Disclaimer: dit zijn benaderingen. Definitieve bedragen via toeslagen.nl.
 */

export interface BenefitsInput {
  year: number;
  /** Jaarlijkse belastbare winst/inkomen aanvrager. */
  income: number;
  hasPartner: boolean;
  partnerIncome: number;
  age: number;
  partnerAge?: number;
  numChildren: number;
  childrenAges: number[];
  rentType: "social" | "private" | "none";
  monthlyRent: number;
  monthlyServiceCosts: number;
  hasChildcare: boolean;
  childcareHoursPerMonth: number;
  childcareHourlyRate: number;
  totalAssets: number;
}

export interface BenefitResult {
  eligible: boolean;
  monthly: number;
  yearly: number;
  reason?: string;
  details?: string[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// ---------------- ZORGTOESLAG 2026 ---------------------------------
// Inkomensgrens: alleenstaand €38.000, met partner €48.000 (indicatief 2026)
// Vermogensgrens: €128.000 alleen, €162.000 partner.
// Maximaal: ±€131/mnd alleen, ±€250/mnd met partner.
export function calcZorgtoeslag(i: BenefitsInput): BenefitResult {
  const totalIncome = i.income + (i.hasPartner ? i.partnerIncome : 0);
  const incomeLimit = i.hasPartner ? 48000 : 38000;
  const assetLimit = i.hasPartner ? 162000 : 128000;
  const maxMonthly = i.hasPartner ? 250 : 131;

  const details: string[] = [
    `Toetsingsinkomen: ${fmt(totalIncome)}`,
    `Inkomensgrens: ${fmt(incomeLimit)}`,
    `Vermogen: ${fmt(i.totalAssets)} (max ${fmt(assetLimit)})`,
  ];

  if (i.totalAssets > assetLimit) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Vermogen boven grens", details };
  }
  if (totalIncome >= incomeLimit) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Inkomen te hoog", details };
  }

  // Lineaire afbouw — drempel rond €25.000 alleen / €33.000 partner
  const drempel = i.hasPartner ? 33000 : 25000;
  let monthly = maxMonthly;
  if (totalIncome > drempel) {
    const reductionPct = (totalIncome - drempel) / (incomeLimit - drempel);
    monthly = Math.max(0, maxMonthly * (1 - reductionPct));
  }

  return {
    eligible: monthly > 0,
    monthly,
    yearly: monthly * 12,
    details,
  };
}

// ---------------- HUURTOESLAG 2026 ---------------------------------
// Sinds 2024 vervalt de strikte kwaliteitskorting: ook hogere huren komen in aanmerking.
// Maximale huur ~€900/mnd. Inkomensgrens: ±€36.000 alleen, ±€48.000 partner.
export function calcHuurtoeslag(i: BenefitsInput): BenefitResult {
  const totalIncome = i.income + (i.hasPartner ? i.partnerIncome : 0);
  const totalRent = i.monthlyRent + i.monthlyServiceCosts;
  const incomeLimit = i.hasPartner ? 48000 : 36000;
  const assetLimit = i.hasPartner ? 73000 : 36500;
  const maxRent = 900; // maximaal in aanmerking komende huur

  const details: string[] = [
    `Toetsingsinkomen: ${fmt(totalIncome)}`,
    `Huur (incl. service): ${fmt(totalRent)}/mnd`,
    `Type woning: ${i.rentType === "social" ? "Sociale huur" : i.rentType === "private" ? "Vrije sector" : "Geen huur"}`,
    `Vermogen: ${fmt(i.totalAssets)} (max ${fmt(assetLimit)})`,
  ];

  if (i.rentType === "none" || totalRent <= 0) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Geen huurwoning", details };
  }
  if (totalRent < 250) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Huur te laag (<€250)", details };
  }
  if (i.totalAssets > assetLimit) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Vermogen boven grens", details };
  }
  if (totalIncome >= incomeLimit) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Inkomen te hoog", details };
  }

  const effectiveRent = Math.min(totalRent, maxRent);
  // Eigen bijdrage: ~€250/mnd basis, schaalt met inkomen
  const incomeShare = Math.max(0, (totalIncome - 22000) * 0.25 / 12);
  const eigenBijdrage = 220 + incomeShare;
  const monthly = Math.max(0, effectiveRent - eigenBijdrage);

  return {
    eligible: monthly > 0,
    monthly,
    yearly: monthly * 12,
    details,
  };
}

// ---------------- KINDEROPVANGTOESLAG 2026 -------------------------
// Vergoedingspercentage 33–96% afhankelijk van inkomen.
// Max uurtarief vergoed: €10,71 (dagopvang 2026 indicatief).
export function calcKinderopvangtoeslag(i: BenefitsInput): BenefitResult {
  const totalIncome = i.income + (i.hasPartner ? i.partnerIncome : 0);
  const maxHourly = 10.71;

  const details: string[] = [
    `Toetsingsinkomen: ${fmt(totalIncome)}`,
    `Uren opvang: ${i.childcareHoursPerMonth}/mnd`,
    `Tarief: ${fmt(i.childcareHourlyRate)}/uur (max vergoed: ${fmt(maxHourly)})`,
  ];

  if (!i.hasChildcare || i.childcareHoursPerMonth <= 0) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Geen kinderopvang ingevuld", details };
  }
  if (i.numChildren <= 0) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Geen kinderen", details };
  }

  // Vergoedingspercentage (vereenvoudigd):
  let pct: number;
  if (totalIncome < 30000) pct = 96;
  else if (totalIncome < 50000) pct = 87;
  else if (totalIncome < 80000) pct = 75;
  else if (totalIncome < 130000) pct = 55;
  else pct = 33;

  const effectiveHourly = Math.min(i.childcareHourlyRate, maxHourly);
  const grossCost = i.childcareHoursPerMonth * effectiveHourly;
  const monthly = grossCost * (pct / 100);

  details.push(`Vergoedingspercentage: ${pct}%`);

  return {
    eligible: monthly > 0,
    monthly,
    yearly: monthly * 12,
    details,
  };
}

// ---------------- KINDGEBONDEN BUDGET 2026 -------------------------
// Maximaal ±€2.500/jr voor 1 kind, oploopt tot meer kinderen.
// Inkomensafbouw boven ±€26.000 (alleen) of ±€38.000 (partner).
// Extra alleenstaande-ouderkop ~€3.300/jr.
export function calcKindgebondenBudget(i: BenefitsInput): BenefitResult {
  const totalIncome = i.income + (i.hasPartner ? i.partnerIncome : 0);
  const assetLimit = i.hasPartner ? 162000 : 128000;

  const details: string[] = [
    `Toetsingsinkomen: ${fmt(totalIncome)}`,
    `Aantal kinderen: ${i.numChildren}`,
    `Vermogen: ${fmt(i.totalAssets)} (max ${fmt(assetLimit)})`,
  ];

  if (i.numChildren <= 0) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Geen kinderen", details };
  }
  if (i.totalAssets > assetLimit) {
    return { eligible: false, monthly: 0, yearly: 0, reason: "Vermogen boven grens", details };
  }

  // Basis per kind
  const baseAmounts = [2511, 2511, 2270, 1635]; // 1e, 2e, 3e, 4e+ (jaarlijks)
  let yearlyMax = 0;
  for (let n = 0; n < i.numChildren; n++) {
    yearlyMax += baseAmounts[Math.min(n, baseAmounts.length - 1)];
  }
  // Verhoging voor 12-17 jarigen
  const teenagers = i.childrenAges.filter((a) => a >= 12 && a <= 17).length;
  const teens16 = i.childrenAges.filter((a) => a >= 16 && a <= 17).length;
  yearlyMax += teenagers * 503;
  yearlyMax += teens16 * 222;

  // Alleenstaande-ouderkop
  if (!i.hasPartner) yearlyMax += 3389;

  // Inkomensafbouw 6,75% boven drempel
  const drempel = i.hasPartner ? 38000 : 26000;
  let yearly = yearlyMax;
  if (totalIncome > drempel) {
    const reduction = (totalIncome - drempel) * 0.0675;
    yearly = Math.max(0, yearlyMax - reduction);
  }

  details.push(`Maximaal: ${fmt(yearlyMax)}/jr`);
  if (totalIncome > drempel) details.push(`Afbouw vanaf ${fmt(drempel)}`);

  return {
    eligible: yearly > 0,
    monthly: yearly / 12,
    yearly,
    details,
  };
}

export function calcAllBenefits(input: BenefitsInput) {
  return {
    zorgtoeslag: calcZorgtoeslag(input),
    huurtoeslag: calcHuurtoeslag(input),
    kinderopvangtoeslag: calcKinderopvangtoeslag(input),
    kindgebondenBudget: calcKindgebondenBudget(input),
  };
}
