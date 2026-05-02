import type { ParsedTx, ParseResult } from "./bankCsvImport";

/**
 * Parsers voor CAMT.053 (ISO 20022 XML) en MT940 (SWIFT plain text).
 * Beide retourneren hetzelfde ParseResult als de CSV-parser, zodat de
 * bestaande importflow ze kan hergebruiken.
 */

// ---------- CAMT.053 ----------

export function parseCamt053(xml: string): ParseResult {
  const errors: string[] = [];
  const transactions: ParsedTx[] = [];

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, "application/xml");
  } catch (e) {
    return emptyResult("camt053", [`XML kon niet gelezen worden: ${(e as Error).message}`]);
  }
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    return emptyResult("camt053", [`Ongeldig XML-bestand: ${parserError.textContent?.slice(0, 120) ?? ""}`]);
  }

  // Werk namespace-onafhankelijk: pak alle <Ntry> nodes.
  const entries = Array.from(doc.getElementsByTagName("*")).filter(
    (n) => localName(n) === "Ntry"
  );
  if (entries.length === 0) {
    errors.push("Geen <Ntry> elementen gevonden — is dit wel CAMT.053?");
  }

  for (const entry of entries) {
    const cdtDbtInd = textOf(entry, "CdtDbtInd"); // CRDT of DBIT
    const amtNode = firstChild(entry, "Amt");
    const amtRaw = amtNode?.textContent?.trim();
    if (!amtRaw) continue;
    const amount = parseFloat(amtRaw) * (cdtDbtInd === "DBIT" ? -1 : 1);

    const bookDt =
      textOf(entry, "BookgDt", "Dt") ||
      textOf(entry, "BookgDt", "DtTm") ||
      textOf(entry, "ValDt", "Dt") ||
      "";
    const date = bookDt.slice(0, 10);
    if (!date) {
      errors.push("Boeking zonder datum overgeslagen");
      continue;
    }

    // Transactiedetails kunnen onder NtryDtls > TxDtls staan. Anders root entry zelf.
    const txDtls = Array.from(entry.getElementsByTagName("*")).filter(
      (n) => localName(n) === "TxDtls"
    );
    const sources = txDtls.length > 0 ? txDtls : [entry];

    for (const src of sources) {
      const txAmtRaw = firstChild(src, "Amt")?.textContent?.trim();
      const txCdtDbt = textOf(src, "CdtDbtInd") || cdtDbtInd;
      const txAmount = txAmtRaw
        ? parseFloat(txAmtRaw) * (txCdtDbt === "DBIT" ? -1 : 1)
        : amount;

      // Tegenpartij hangt af van richting: bij DBIT (uitgaand) -> Cdtr, bij CRDT (inkomend) -> Dbtr
      const isOutgoing = txCdtDbt === "DBIT";
      const counterpartyName =
        textOf(src, isOutgoing ? "Cdtr" : "Dbtr", "Nm") ||
        textOf(src, isOutgoing ? "RltdPties" : "RltdPties", isOutgoing ? "Cdtr" : "Dbtr", "Nm") ||
        textOf(src, "RltdPties", isOutgoing ? "Cdtr" : "Dbtr", "Pty", "Nm") ||
        undefined;

      const counterpartyIban =
        textOf(src, "RltdPties", isOutgoing ? "CdtrAcct" : "DbtrAcct", "Id", "IBAN") ||
        textOf(src, isOutgoing ? "CdtrAcct" : "DbtrAcct", "Id", "IBAN") ||
        undefined;

      const remittance =
        textOf(src, "RmtInf", "Ustrd") ||
        Array.from(src.getElementsByTagName("*"))
          .filter((n) => localName(n) === "Ustrd")
          .map((n) => n.textContent?.trim())
          .filter(Boolean)
          .join(" ") ||
        textOf(src, "AddtlTxInf") ||
        textOf(entry, "AddtlNtryInf") ||
        "";

      const ref =
        textOf(src, "Refs", "EndToEndId") ||
        textOf(src, "Refs", "TxId") ||
        textOf(src, "RmtInf", "Strd", "CdtrRefInf", "Ref") ||
        undefined;

      transactions.push({
        transaction_date: date,
        amount: round2(txAmount),
        description: remittance || counterpartyName || "Banktransactie",
        counterparty_name: counterpartyName,
        counterparty_iban: counterpartyIban,
        payment_reference: ref,
        raw: { source: "camt053" },
      });
    }
  }

  return {
    transactions,
    errors,
    detected: {
      delimiter: "xml",
      headers: ["camt.053"],
      dateColumn: "BookgDt",
      amountColumn: "Amt",
      descriptionColumn: "RmtInf/Ustrd",
    },
  };
}

// ---------- MT940 ----------

export function parseMt940(text: string): ParseResult {
  const errors: string[] = [];
  const transactions: ParsedTx[] = [];

  // MT940 fields starten met :NN: aan begin van regel. Een transactie = :61: gevolgd door optionele :86:
  // Vouw eerst alle vervolgregels in op de voorgaande tag.
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];
  for (const ln of rawLines) {
    if (/^:\d{2}[A-Z]?:/.test(ln)) lines.push(ln);
    else if (lines.length > 0) lines[lines.length - 1] += ln;
  }

  // Bepaal jaar uit :60F: (opening balance) → YYMMDD
  let defaultYear = new Date().getFullYear();
  const opening = lines.find((l) => l.startsWith(":60F:") || l.startsWith(":60M:"));
  if (opening) {
    const m = opening.match(/:60[FM]:[CD](\d{2})(\d{2})(\d{2})/);
    if (m) defaultYear = 2000 + parseInt(m[1], 10);
  }

  let pending: ParsedTx | null = null;
  for (const line of lines) {
    if (line.startsWith(":61:")) {
      if (pending) transactions.push(pending);
      // :61:YYMMDD[MMDD]C/D[xxx]amount,...//ref
      const body = line.slice(4);
      const m = body.match(/^(\d{2})(\d{2})(\d{2})(?:\d{4})?(R?[CD])([A-Z]?)(\d+(?:,\d{0,2})?)/);
      if (!m) {
        errors.push(`Onbegrepen :61:-regel: ${line.slice(0, 60)}`);
        continue;
      }
      const yy = parseInt(m[1], 10);
      const mm = m[2];
      const dd = m[3];
      const dc = m[4]; // C, D, RC, RD
      const amt = parseFloat(m[6].replace(",", "."));
      const sign = dc.includes("D") ? -1 : 1;
      const reverse = dc.startsWith("R") ? -1 : 1;
      const year = 2000 + yy < defaultYear - 50 ? 2100 + yy : 2000 + yy;

      pending = {
        transaction_date: `${year}-${mm}-${dd}`,
        amount: round2(amt * sign * reverse),
        description: "",
        raw: { source: "mt940", line: line.slice(0, 200) },
      };
    } else if (line.startsWith(":86:") && pending) {
      const info = line.slice(4).trim();
      pending.description = cleanMt940Info(info);
      const ibanMatch = info.match(/[A-Z]{2}\d{2}[A-Z0-9]{10,30}/);
      if (ibanMatch) pending.counterparty_iban = ibanMatch[0];
      // Veelgebruikte structured tag voor naam: /NAME/... of subfield ?32 in Duitse banken
      const nameMatch =
        info.match(/\/NAME\/([^/]+)/i) ||
        info.match(/\?32([^?]+)/) ||
        info.match(/\bnaam:\s*([^/?]+)/i);
      if (nameMatch) pending.counterparty_name = nameMatch[1].trim();
      const refMatch = info.match(/\/REF\/([^/]+)/i) || info.match(/kenmerk:\s*([^/?]+)/i);
      if (refMatch) pending.payment_reference = refMatch[1].trim();
    }
  }
  if (pending) transactions.push(pending);

  return {
    transactions,
    errors,
    detected: {
      delimiter: "mt940",
      headers: [":61:", ":86:"],
      dateColumn: ":61: date",
      amountColumn: ":61: amount",
      descriptionColumn: ":86:",
    },
  };
}

// ---------- Detect & dispatch ----------

export function detectStatementFormat(text: string): "camt053" | "mt940" | "csv" | "unknown" {
  const head = text.slice(0, 2048).trim();
  if (head.startsWith("<?xml") || head.includes("<Document") || head.includes(":Document")) {
    if (text.includes("BkToCstmrStmt") || text.toLowerCase().includes("camt.053")) return "camt053";
    if (text.includes("<Ntry")) return "camt053";
  }
  if (/^:\d{2}[A-Z]?:/m.test(head) && (head.includes(":61:") || head.includes(":60F:"))) {
    return "mt940";
  }
  if (head.includes(",") || head.includes(";")) return "csv";
  return "unknown";
}

// ---------- helpers ----------

function localName(n: Element): string {
  return n.localName ?? n.tagName.split(":").pop() ?? n.tagName;
}

function firstChild(parent: Element, name: string): Element | null {
  for (const c of Array.from(parent.children)) {
    if (localName(c) === name) return c;
  }
  return null;
}

function textOf(parent: Element, ...path: string[]): string {
  let cur: Element | null = parent;
  for (const p of path) {
    if (!cur) return "";
    const next: Element | null =
      Array.from(cur.children).find((c) => localName(c) === p) ??
      Array.from(cur.getElementsByTagName("*")).find((c) => localName(c as Element) === p) ??
      null;
    cur = next as Element | null;
  }
  return cur?.textContent?.trim() ?? "";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function cleanMt940Info(s: string): string {
  // Verwijder Duitse subfield-codes (?20, ?21, ...) maar behoud tekst
  return s.replace(/\?\d{2}/g, " ").replace(/\s+/g, " ").trim();
}

function emptyResult(kind: string, errors: string[]): ParseResult {
  return {
    transactions: [],
    errors,
    detected: { delimiter: kind, headers: [] },
  };
}
