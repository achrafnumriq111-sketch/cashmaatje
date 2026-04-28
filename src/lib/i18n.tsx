import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "nl" | "en";

type Dict = Record<string, { nl: string; en: string }>;

const dict: Dict = {
  // Common
  "common.dashboard": { nl: "Dashboard", en: "Dashboard" },
  "common.search": { nl: "Zoeken...", en: "Search..." },
  "common.loading": { nl: "Laden...", en: "Loading..." },
  "common.save": { nl: "Opslaan", en: "Save" },
  "common.cancel": { nl: "Annuleren", en: "Cancel" },
  "common.delete": { nl: "Verwijderen", en: "Delete" },
  "common.edit": { nl: "Bewerken", en: "Edit" },
  "common.add": { nl: "Toevoegen", en: "Add" },
  "common.actions": { nl: "Acties", en: "Actions" },
  "common.amount": { nl: "Bedrag", en: "Amount" },
  "common.date": { nl: "Datum", en: "Date" },
  "common.status": { nl: "Status", en: "Status" },
  "common.description": { nl: "Omschrijving", en: "Description" },

  // Nav groups
  "nav.finance": { nl: "Boekhouding", en: "Bookkeeping" },
  "nav.reports": { nl: "Rapporten", en: "Reports" },
  "nav.tax": { nl: "Belasting", en: "Tax" },
  "nav.costs": { nl: "Kosten & Activa", en: "Costs & Assets" },
  "nav.platform": { nl: "Platform", en: "Platform" },
  "nav.audit": { nl: "Audit & Compliance", en: "Audit & Compliance" },

  // Nav items
  "nav.transactions": { nl: "Transacties", en: "Transactions" },
  "nav.invoices": { nl: "Facturen", en: "Invoices" },
  "nav.invoices.sales": { nl: "Verkoop", en: "Sales" },
  "nav.invoices.purchase": { nl: "Inkoop", en: "Purchase" },
  "nav.invoices.reminders": { nl: "Herinneringen", en: "Reminders" },
  "nav.reconciliation": { nl: "Reconciliatie", en: "Reconciliation" },
  "nav.documents": { nl: "Documenten & Bonnen", en: "Documents & Receipts" },
 "nav.vat": { nl: "BTW", en: "VAT" },
 "nav.vatWins": { nl: "BTW & Wins", en: "VAT & Wins" },
  "nav.vat.return": { nl: "Aangifte", en: "Return" },
  "nav.vat.icp": { nl: "ICP Opgaaf", en: "ICP Statement" },
  "nav.salary": { nl: "Salaris", en: "Salary" },
  "nav.salary.overview": { nl: "Overzicht", en: "Overview" },
  "nav.businessExpenses": { nl: "Bedrijfskosten", en: "Business expenses" },
  "nav.depreciations": { nl: "Afschrijvingen", en: "Depreciations" },
  "nav.taxDeductions": { nl: "Ondernemersaftrek", en: "Entrepreneur deductions" },
  "nav.premiums": { nl: "Premies", en: "Premiums" },
  "nav.companyCar": { nl: "Auto van de zaak", en: "Company car" },
  "nav.mortgage": { nl: "Koopwoning", en: "Mortgage" },
  "nav.profitLoss": { nl: "Winst & Verlies", en: "Profit & Loss" },
  "nav.balanceSheet": { nl: "Balans", en: "Balance Sheet" },
  "nav.trialBalance": { nl: "Proefbalans", en: "Trial Balance" },
  "nav.cashflow": { nl: "Kasstroomoverzicht", en: "Cash Flow Statement" },
  "nav.annualReport": { nl: "Jaarrekening", en: "Annual Report" },
  "nav.intelligence": { nl: "Financial Intelligence", en: "Financial Intelligence" },
  "nav.contacts": { nl: "Relaties", en: "Contacts" },
  "nav.ledger": { nl: "Grootboek", en: "General Ledger" },
  "nav.journal": { nl: "Journaalposten", en: "Journal Entries" },
  "nav.quotes": { nl: "Offertes & Branding", en: "Quotes & Branding" },
  "nav.audit.dossier": { nl: "Audit Dossier", en: "Audit Dossier" },
  "nav.audit.contracts": { nl: "Contract Intelligence", en: "Contract Intelligence" },
  "nav.audit.compliance": { nl: "Compliance Check", en: "Compliance Check" },
  "nav.audit.processes": { nl: "Process & Controls", en: "Process & Controls" },
  "nav.platform.stakeholders": { nl: "Stakeholder CRM", en: "Stakeholder CRM" },
  "nav.platform.automation": { nl: "Automation Center", en: "Automation Center" },
  "nav.platform.structure": { nl: "Corporate Structure", en: "Corporate Structure" },
  "nav.platform.referral": { nl: "Referral Center", en: "Referral Center" },
  "nav.platform.themes": { nl: "Thema's", en: "Themes" },
  "nav.settings": { nl: "Instellingen", en: "Settings" },
  "nav.auditLog": { nl: "Audit Log", en: "Audit Log" },
  "nav.integrations": { nl: "Integraties", en: "Integrations" },
  "nav.inventory": { nl: "Voorraad", en: "Inventory" },

  // Header
  "header.referrals": { nl: "Referrals", en: "Referrals" },
  "header.notifications": { nl: "Notificaties", en: "Notifications" },
  "header.profile": { nl: "Profiel", en: "Profile" },
  "header.signOut": { nl: "Uitloggen", en: "Sign out" },
  "header.language": { nl: "Taal", en: "Language" },
  "header.switchOrg": { nl: "Wissel organisatie", en: "Switch organization" },
  "header.editOrg": { nl: "Bedrijfsgegevens", en: "Company details" },
  "header.bulkSettings": { nl: "Bulk instellingen", en: "Bulk settings" },

  // Chat
  "chat.title": { nl: "Cashmaatje Assistent", en: "Cashmaatje Assistant" },
  "chat.placeholder": { nl: "Stel een vraag...", en: "Ask a question..." },
  "chat.greeting": {
    nl: "Hoi! Ik help je graag met je administratie. Waar kan ik mee helpen?",
    en: "Hi! Happy to help with your bookkeeping. What can I help you with?",
  },

  // Tooltips
  "tip.businessExpenses": {
    nl: "Vaste maandlasten zoals software, telefoon en huur. Worden meegenomen in winstberekening.",
    en: "Fixed monthly costs like software, phone and rent. Included in profit calculations.",
  },
  "tip.cashflow": {
    nl: "Overzicht van geldstromen in en uit. Toont wat er werkelijk binnenkomt en uitgaat.",
    en: "Overview of money flowing in and out. Shows actual incoming and outgoing.",
  },
  "tip.referrals": {
    nl: "Verdien credits door anderen uit te nodigen. Unlock extra modules.",
    en: "Earn credits by inviting others. Unlock extra modules.",
  },
};

interface I18nContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "arcory.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "nl";
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    return stored === "en" || stored === "nl" ? stored : "nl";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string): string => {
    const entry = dict[key];
    if (!entry) return key;
    return entry[lang];
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
