import type { ParsedTx } from "./bankCsvImport";

export interface ContactRow {
  id: string;
  name: string;
  iban?: string | null;
  is_customer?: boolean | null;
  is_supplier?: boolean | null;
}

export type MatchAction =
  | { kind: "link"; contactId: string }
  | { kind: "create"; name: string; iban?: string; isCustomer: boolean; isSupplier: boolean }
  | { kind: "skip" };

export interface CounterpartyGroup {
  /** Unieke sleutel: IBAN als beschikbaar, anders genormaliseerde naam */
  key: string;
  displayName: string;
  iban?: string;
  txCount: number;
  totalAmount: number;
  /** Of deze groep voornamelijk inkomend (klant) of uitgaand (leverancier) is */
  direction: "in" | "out" | "mixed";
  suggestion?: {
    contact: ContactRow;
    confidence: number;
    reason: "iban" | "name_exact" | "name_fuzzy";
  };
  action: MatchAction;
}

function normalizeName(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\b(b\.?v\.?|n\.?v\.?|v\.?o\.?f\.?|gmbh|ltd|inc|llc|sa|bvba)\b/gi, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const A = normalizeName(a);
  const B = normalizeName(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  if (A.includes(B) || B.includes(A)) return 0.85;
  // token overlap
  const ta = new Set(A.split(" "));
  const tb = new Set(B.split(" "));
  let overlap = 0;
  ta.forEach((t) => tb.has(t) && overlap++);
  const denom = Math.max(ta.size, tb.size);
  return denom > 0 ? overlap / denom : 0;
}

export function buildCounterpartyGroups(
  txs: ParsedTx[],
  contacts: ContactRow[],
): CounterpartyGroup[] {
  const map = new Map<string, CounterpartyGroup>();

  for (const tx of txs) {
    const iban = (tx.counterparty_iban || "").replace(/\s/g, "").toUpperCase();
    const name = tx.counterparty_name || "";
    const key = iban || normalizeName(name) || "__unknown__";
    const display = name || iban || "Onbekende tegenpartij";

    let g = map.get(key);
    if (!g) {
      g = {
        key,
        displayName: display,
        iban: iban || undefined,
        txCount: 0,
        totalAmount: 0,
        direction: tx.amount >= 0 ? "in" : "out",
        action: { kind: "skip" },
      };
      map.set(key, g);
    }
    g.txCount++;
    g.totalAmount += tx.amount;
    const dir: "in" | "out" = tx.amount >= 0 ? "in" : "out";
    if (g.direction !== dir) g.direction = "mixed";
  }

  // Suggesties opbouwen
  for (const g of map.values()) {
    let best: CounterpartyGroup["suggestion"] | undefined;

    if (g.iban) {
      const byIban = contacts.find(
        (c) => (c.iban || "").replace(/\s/g, "").toUpperCase() === g.iban,
      );
      if (byIban) best = { contact: byIban, confidence: 0.99, reason: "iban" };
    }

    if (!best) {
      let bestScore = 0;
      let bestC: ContactRow | null = null;
      for (const c of contacts) {
        const s = similarity(g.displayName, c.name);
        if (s > bestScore) {
          bestScore = s;
          bestC = c;
        }
      }
      if (bestC && bestScore >= 0.6) {
        best = {
          contact: bestC,
          confidence: bestScore,
          reason: bestScore === 1 ? "name_exact" : "name_fuzzy",
        };
      }
    }

    if (best) {
      g.suggestion = best;
      // Auto-accept hoge zekerheid
      if (best.confidence >= 0.85) {
        g.action = { kind: "link", contactId: best.contact.id };
      }
    } else if (g.key !== "__unknown__" && g.displayName !== "Onbekende tegenpartij") {
      // Geen match → standaard aanmaken
      g.action = {
        kind: "create",
        name: g.displayName,
        iban: g.iban,
        isCustomer: g.direction === "in" || g.direction === "mixed",
        isSupplier: g.direction === "out" || g.direction === "mixed",
      };
    }
  }

  return Array.from(map.values()).sort((a, b) => b.txCount - a.txCount);
}

export function txGroupKey(tx: ParsedTx): string {
  const iban = (tx.counterparty_iban || "").replace(/\s/g, "").toUpperCase();
  if (iban) return iban;
  return normalizeName(tx.counterparty_name || "") || "__unknown__";
}
