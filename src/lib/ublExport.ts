/**
 * UBL 2.1 Invoice export (NLCIUS profile - Dutch e-invoicing).
 * Generates an XML string ready for download or Peppol access-point submission.
 *
 * Spec: https://www.gs1.nl/sites/default/files/2023-11/NLCIUS-spec.pdf
 */

interface UblOrg {
  name: string;
  legal_name?: string | null;
  kvk_number?: string | null;
  btw_number?: string | null;
  address_street?: string | null;
  address_postal_code?: string | null;
  address_city?: string | null;
  address_country?: string | null;
  iban?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface UblContact {
  name: string;
  email?: string | null;
  address_street?: string | null;
  address_postal_code?: string | null;
  address_city?: string | null;
  address_country?: string | null;
  btw_number?: string | null;
}

interface UblLine {
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number; // excl. BTW
  vat_amount: number;
  vat_percentage: number;
  vat_rate_type: string; // high|low|zero|exempt|reverse_charge|icp|export
}

interface UblInvoice {
  invoice_number: string;
  invoice_date: string; // YYYY-MM-DD
  due_date: string | null;
  currency: string;
  subtotal: number;
  total_vat: number;
  total_amount: number;
  notes?: string | null;
  payment_reference?: string | null;
  payment_link_url?: string | null;
}

// Map onze rate_type → UBL TaxCategory ID (per NLCIUS/EN 16931 codelijst UNCL5305)
const VAT_CATEGORY_CODE: Record<string, string> = {
  high: "S",          // Standard rate
  low: "S",           // Reduced rate -> ook 'S' met percentage 9
  zero: "Z",          // Zero rated
  exempt: "E",        // Exempt
  reverse_charge: "AE", // Reverse charge
  icp: "K",           // Intra-community EU supply
  export: "G",        // Export outside EU
  import: "S",
  margin: "S",
};

function xmlEscape(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function partyXml(tag: "AccountingSupplierParty" | "AccountingCustomerParty", org: UblOrg | UblContact, isSupplier: boolean): string {
  const orgAny = org as UblOrg & UblContact;
  const country = orgAny.address_country || "NL";
  const legalName = (isSupplier ? (org as UblOrg).legal_name : null) || org.name;
  const kvk = isSupplier ? (org as UblOrg).kvk_number : null;
  const btw = orgAny.btw_number;

  return `<cac:${tag}>
    <cac:Party>
      ${btw ? `<cbc:EndpointID schemeID="9944">${xmlEscape(btw)}</cbc:EndpointID>` : ""}
      <cac:PartyName><cbc:Name>${xmlEscape(org.name)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        ${orgAny.address_street ? `<cbc:StreetName>${xmlEscape(orgAny.address_street)}</cbc:StreetName>` : ""}
        ${orgAny.address_city ? `<cbc:CityName>${xmlEscape(orgAny.address_city)}</cbc:CityName>` : ""}
        ${orgAny.address_postal_code ? `<cbc:PostalZone>${xmlEscape(orgAny.address_postal_code)}</cbc:PostalZone>` : ""}
        <cac:Country><cbc:IdentificationCode>${xmlEscape(country)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${btw ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${xmlEscape(btw)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xmlEscape(legalName)}</cbc:RegistrationName>
        ${kvk ? `<cbc:CompanyID schemeID="0106">${xmlEscape(kvk)}</cbc:CompanyID>` : ""}
      </cac:PartyLegalEntity>
      ${org.email ? `<cac:Contact><cbc:ElectronicMail>${xmlEscape(org.email)}</cbc:ElectronicMail></cac:Contact>` : ""}
    </cac:Party>
  </cac:${tag}>`;
}

export function buildInvoiceUbl(args: {
  invoice: UblInvoice;
  supplier: UblOrg;
  customer: UblContact;
  lines: UblLine[];
}): string {
  const { invoice, supplier, customer, lines } = args;
  const currency = invoice.currency || "EUR";

  // Bundle lines per VAT category+percentage
  const taxBuckets = new Map<string, { code: string; pct: number; base: number; vat: number; rateType: string }>();
  for (const ln of lines) {
    const code = VAT_CATEGORY_CODE[ln.vat_rate_type] || "S";
    const key = `${code}-${ln.vat_percentage}`;
    const b = taxBuckets.get(key) || { code, pct: ln.vat_percentage, base: 0, vat: 0, rateType: ln.vat_rate_type };
    b.base += ln.line_total;
    b.vat += ln.vat_amount;
    taxBuckets.set(key, b);
  }

  const taxSubtotalXml = Array.from(taxBuckets.values()).map((b) => `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${money(b.base)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${money(b.vat)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${b.code}</cbc:ID>
        <cbc:Percent>${b.pct.toFixed(2)}</cbc:Percent>
        ${b.code === "AE" ? "<cbc:TaxExemptionReasonCode>VATEX-EU-AE</cbc:TaxExemptionReasonCode><cbc:TaxExemptionReason>Reverse charge</cbc:TaxExemptionReason>" : ""}
        ${b.code === "K" ? "<cbc:TaxExemptionReasonCode>VATEX-EU-IC</cbc:TaxExemptionReasonCode><cbc:TaxExemptionReason>Intra-community supply</cbc:TaxExemptionReason>" : ""}
        ${b.code === "E" ? "<cbc:TaxExemptionReasonCode>VATEX-EU-O</cbc:TaxExemptionReasonCode><cbc:TaxExemptionReason>Exempt</cbc:TaxExemptionReason>" : ""}
        ${b.code === "Z" || b.code === "G" ? "<cbc:TaxExemptionReasonCode>VATEX-EU-G</cbc:TaxExemptionReasonCode><cbc:TaxExemptionReason>Zero rated</cbc:TaxExemptionReason>" : ""}
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`).join("");

  const linesXml = lines.map((ln) => {
    const code = VAT_CATEGORY_CODE[ln.vat_rate_type] || "S";
    return `
    <cac:InvoiceLine>
      <cbc:ID>${ln.line_number}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${ln.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${currency}">${money(ln.line_total)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${xmlEscape(ln.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${code}</cbc:ID>
          <cbc:Percent>${ln.vat_percentage.toFixed(2)}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${currency}">${money(ln.unit_price)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
  }).join("");

  const paymentMeansXml = supplier.iban ? `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    ${invoice.payment_reference ? `<cbc:PaymentID>${xmlEscape(invoice.payment_reference)}</cbc:PaymentID>` : `<cbc:PaymentID>${xmlEscape(invoice.invoice_number)}</cbc:PaymentID>`}
    <cac:PayeeFinancialAccount>
      <cbc:ID>${xmlEscape(supplier.iban)}</cbc:ID>
      <cbc:Name>${xmlEscape(supplier.legal_name || supplier.name)}</cbc:Name>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${xmlEscape(invoice.invoice_number)}</cbc:ID>
  <cbc:IssueDate>${invoice.invoice_date}</cbc:IssueDate>
  ${invoice.due_date ? `<cbc:DueDate>${invoice.due_date}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  ${invoice.notes ? `<cbc:Note>${xmlEscape(invoice.notes)}</cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  ${partyXml("AccountingSupplierParty", supplier, true)}
  ${partyXml("AccountingCustomerParty", customer, false)}
  ${paymentMeansXml}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${money(invoice.total_vat)}</cbc:TaxAmount>
    ${taxSubtotalXml}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${money(invoice.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${money(invoice.subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${money(invoice.total_amount)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${money(invoice.total_amount)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${linesXml}
</Invoice>`;
}

export function downloadUbl(filename: string, xml: string) {
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xml") ? filename : `${filename}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
