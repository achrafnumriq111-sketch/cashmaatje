// Lightweight, dependency-free validators voor NL ondernemersgegevens.

export type ValidationResult = { valid: boolean; error?: string };

const ok: ValidationResult = { valid: true };

/** KvK: precies 8 cijfers. Optional checksum bestaat niet officieel, dus alleen format. */
export function validateKvK(value: string, required = false): ValidationResult {
  const v = (value || "").trim();
  if (!v) return required ? { valid: false, error: "KVK-nummer is verplicht" } : ok;
  if (!/^\d{8}$/.test(v)) return { valid: false, error: "KVK-nummer moet 8 cijfers zijn" };
  return ok;
}

/** Nederlandse BTW: NL + 9 cijfers + B + 2 cijfers (bijv. NL123456789B01). */
export function validateBTW(value: string, required = false): ValidationResult {
  const v = (value || "").trim().toUpperCase();
  if (!v || v === "NL") return required ? { valid: false, error: "BTW-nummer is verplicht" } : ok;
  if (!/^NL\d{9}B\d{2}$/.test(v)) {
    return { valid: false, error: "Formaat: NL gevolgd door 9 cijfers, B en 2 cijfers (NL123456789B01)" };
  }
  return ok;
}

/** IBAN met mod-97 checksum. */
export function validateIBAN(value: string, required = false): ValidationResult {
  const v = (value || "").replace(/\s+/g, "").toUpperCase();
  if (!v) return required ? { valid: false, error: "IBAN is verplicht" } : ok;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v)) {
    return { valid: false, error: "Ongeldig IBAN formaat" };
  }
  // Mod-97
  const rearranged = v.slice(4) + v.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  // bigint mod via chunks
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    remainder = Number(String(remainder) + numeric.slice(i, i + 7)) % 97;
  }
  if (remainder !== 1) return { valid: false, error: "IBAN checksum klopt niet" };
  return ok;
}

/** BIC/SWIFT: 8 of 11 alfanumeriek. */
export function validateBIC(value: string, required = false): ValidationResult {
  const v = (value || "").trim().toUpperCase();
  if (!v) return required ? { valid: false, error: "BIC is verplicht" } : ok;
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v)) {
    return { valid: false, error: "Ongeldig BIC (8 of 11 tekens)" };
  }
  return ok;
}

/** Nederlandse postcode: 1234 AB (spatie optioneel). */
export function validatePostcode(value: string, required = false): ValidationResult {
  const v = (value || "").trim().toUpperCase();
  if (!v) return required ? { valid: false, error: "Postcode is verplicht" } : ok;
  if (!/^\d{4}\s?[A-Z]{2}$/.test(v)) return { valid: false, error: "Postcode formaat: 1234 AB" };
  return ok;
}

export function validateEmail(value: string, required = false): ValidationResult {
  const v = (value || "").trim();
  if (!v) return required ? { valid: false, error: "E-mail is verplicht" } : ok;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { valid: false, error: "Ongeldig e-mailadres" };
  return ok;
}

/** Auto-detect bank op basis van eerste 8 IBAN-tekens. */
export function bankFromIBAN(iban: string): string | null {
  const v = (iban || "").replace(/\s+/g, "").toUpperCase();
  if (!/^NL\d{2}[A-Z]{4}/.test(v)) return null;
  const code = v.slice(4, 8);
  const map: Record<string, string> = {
    INGB: "ING", RABO: "Rabobank", ABNA: "ABN AMRO", TRIO: "Triodos",
    SNSB: "SNS Bank", ASNB: "ASN Bank", KNAB: "Knab", BUNQ: "bunq",
    REVO: "Revolut", FVLB: "Van Lanschot", DEUT: "Deutsche Bank", NWAB: "NIBC",
    HAND: "Svenska Handelsbanken", FRGH: "Franx",
  };
  return map[code] ?? null;
}

/** Bereken nieuwe factuurnummers op basis van format + startseq. */
export function previewInvoiceNumbers(
  numbering: { prefix: string; format: string; nextSeq: number },
  count = 3,
  year = new Date().getFullYear(),
): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const seq = numbering.nextSeq + i;
    out.push(
      numbering.format
        .replace(/\{prefix\}/g, numbering.prefix)
        .replace(/\{year\}/g, String(year))
        .replace(/\{seq:(\d+)\}/g, (_, w) => String(seq).padStart(parseInt(w), "0"))
        .replace(/\{seq\}/g, String(seq)),
    );
  }
  return out;
}
