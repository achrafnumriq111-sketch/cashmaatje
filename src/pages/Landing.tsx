import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { ArrowRight, Check, Users, Sparkles, Info, ShieldCheck, Lock, Server, FileCheck2 } from "lucide-react";
import { useI18n, type Language } from "@/lib/i18n";
import duskSky from "@/assets/dusk-sky.jpg";
import textureSand from "@/assets/texture-sand.jpg";
import textureWater from "@/assets/texture-water.jpg";
import textureLavender from "@/assets/texture-lavender.jpg";
import textureMarble from "@/assets/texture-marble.jpg";

/* ──────────────────────────────────────────────────────────────────
   CashMaatje — Landing (Origin Financial design system)
   Trust-first: security visible, claims juridisch veilig, echte modules.
   ────────────────────────────────────────────────────────────────── */

type ToeslagKey = "zorg" | "huur" | "kgb" | "kov";

type PlanTier = {
  name: string;
  tag: string;
  price: string;
  per: string;
  desc: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

type Copy = {
  nav: { product: string; toeslagen: string; pricing: string; security: string; signin: string; start: string };
  hero: {
    badge: string;
    titleA: string;
    titleB: string;
    sub: string;
    cta: string;
    seeHow: string;
    trustLine: string;
  };
  benefits: { items: { eyebrow: string; title: string; desc: string }[] };
  featuresHeading: { titleA: string; titleB: string; sub: string };
  feature: {
    items: { label: string; title: string; desc: string; bullets: string[] }[];
    integrationsLabel: string;
    integrations: string[];
  };
  ai: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    sub: string;
    question: string;
    answer: string;
    confirm: string;
    later: string;
    foot: string;
  };
  socialProof: { eyebrow: string; line: string; badge: string };
  toeslagen: {
    eyebrow: string; titleA: string; titleB: string; sub: string;
    income: string; incomePh: string; partner: string; partnerIncome: string;
    kids: string; rent: string; rentPh: string; daycare: string; daycarePh: string;
    resultTitle: string; perMonth: string; noRight: string; indication: string;
    apply: string; foot: string;
    rulesHint: string; sourceLabel: string; sourceUrl: string;
    labels: Record<ToeslagKey, { name: string; tag: string }>;
  };
  plan: {
    eyebrow: string; titleA: string; titleB: string; sub: string;
    tiers: PlanTier[];
    disclaimer: string;
    referralHeading: string; referralSub: string;
    steps: { t: string; d: string }[];
    foot: string;
  };
  finalCta: { titleA: string; titleB: string; sub: string; cta: string; bullets: string[] };
  footer: { links: { label: string; to: string }[]; copy: string };
};

const copy: Record<Language, Copy> = {
  nl: {
    nav: { product: "PRODUCT", toeslagen: "TOESLAGENCHECK", pricing: "PRIJZEN", security: "SECURITY", signin: "INLOGGEN", start: "Probeer gratis" },
    hero: {
      badge: "Eerste maand gratis · geen creditcard",
      titleA: "Boekhouding",
      titleB: "die met je meedenkt.",
      sub: "Facturen, bonnen, BTW en financiële inzichten automatisch op één plek. CashMaatje helpt Nederlandse ondernemers grip te houden op hun geld — zonder spreadsheetstress.",
      cta: "Start gratis",
      seeHow: "Bekijk demo",
      trustLine: "Eerste maand gratis · Geen creditcard · AVG-proof · EU-hosting · Altijd opzegbaar",
    },
    benefits: {
      items: [
        { eyebrow: "AUTOPILOT", title: "Werk uit handen", desc: "Bonnen, bank en facturen worden automatisch verwerkt. Jij keurt alleen nog goed." },
        { eyebrow: "FISCAAL KLAAR", title: "Altijd belasting-klaar", desc: "Realtime BTW- en IB-reserve. Aangifte voorbereid, jij of je accountant dient in." },
        { eyebrow: "HELDER", title: "Eén overzicht", desc: "Cashflow, winst en BTW in één rustig beeld. Geen losse spreadsheets meer." },
      ],
    },
    featuresHeading: { titleA: "Vereenvoudig", titleB: "je geld.", sub: "Vier kernmodules met concrete koppelingen die je administratie geruisloos draaien." },
    feature: {
      items: [
        {
          label: "Facturatie",
          title: "Facturen die zichzelf opvolgen",
          desc: "Verstuur professionele facturen in PDF én UBL-formaat. Betaallinks via Mollie en Stripe. Automatische herinneringen.",
          bullets: ["UBL & PDF", "Mollie · Stripe betaallinks", "Auto-herinneringen", "KOR-ondersteuning"],
        },
        {
          label: "Bonnen & kosten",
          title: "Bonnen automatisch herkennen",
          desc: "Upload of mail je bon. CashMaatje leest leverancier, bedrag, BTW en categorie automatisch uit. Jij keurt alleen nog goed.",
          bullets: ["E-mailinbox per bedrijf", "Mobiele upload", "AI-suggestie + jij keurt goed", "Audit trail per boeking"],
        },
        {
          label: "Live dashboard",
          title: "Realtime cashflow",
          desc: "Veilige bankkoppeling via PSD2 met alle grote Nederlandse banken. Eén beeld voor winst, BTW en liquiditeit.",
          bullets: ["ING · Rabobank · ABN · Knab · bunq · Revolut", "Automatische reconciliatie", "Cashflow-prognose", "Winst per project/klant"],
        },
        {
          label: "Belasting-reserve",
          title: "Geen verrassingen meer",
          desc: "We berekenen je BTW- en IB-reserve automatisch. Jij bevestigt elke verplaatsing — niets gebeurt zonder jouw akkoord.",
          bullets: ["BTW per kwartaal/maand", "IB-reserve voor ZZP", "VPB-reserve voor BV", "Jij bevestigt elke actie"],
        },
      ],
      integrationsLabel: "WERKT MET",
      integrations: ["ING", "Rabobank", "ABN AMRO", "Knab", "bunq", "Revolut", "Mollie", "Stripe", "Shopify", "UBL-export", "Exact-export"],
    },
    ai: {
      eyebrow: "AI-ASSISTENT",
      titleA: "Vraag het",
      titleB: "aan Cash Maatje.",
      sub: "AI doet voorstellen, jij houdt de controle. Geen actie zonder jouw bevestiging.",
      question: "Hoeveel BTW moet ik nog reserveren dit kwartaal?",
      answer: "Je BTW-reserve staat €1.240 onder je verwachte verplichting. Wil je dit bedrag reserveren?",
      confirm: "Bevestig reservering",
      later: "Later",
      foot: "Cash Maatje verplaatst nooit zelfstandig geld. Elke fiscale of financiële actie vereist jouw expliciete bevestiging.",
    },
    socialProof: {
      eyebrow: "VOOR WIE",
      line: "Gebouwd voor Nederlandse zzp'ers en kleine BV's.",
      badge: "Momenteel in private beta met Nederlandse ondernemers",
    },
    toeslagen: {
      eyebrow: "TOESLAGENCHECK",
      titleA: "Recht op",
      titleB: "toeslagen?",
      sub: "Krijg binnen enkele seconden een indicatie van mogelijke toeslagen. De definitieve beoordeling gebeurt altijd via de Belastingdienst.",
      income: "Bruto jaarinkomen",
      incomePh: "bv. 28000",
      partner: "Met fiscaal partner",
      partnerIncome: "Inkomen partner",
      kids: "Aantal kinderen < 18",
      rent: "Maandhuur (€)",
      rentPh: "bv. 850",
      daycare: "Opvang uren/maand",
      daycarePh: "bv. 80",
      resultTitle: "Jouw indicatie",
      perMonth: "/mnd",
      noRight: "Vul je gegevens in om je indicatie te zien.",
      indication: "INDICATIE",
      apply: "Aanvraag voorbereiden",
      foot: "Indicatie op basis van Belastingdienst-thresholds 2026. Geen rechten te ontlenen. Definitieve beoordeling via Belastingdienst.",
      rulesHint: "Zorgtoeslag verschijnt bij inkomen onder de grens. Huurtoeslag vanaf €250 huur. Kinderopvangtoeslag bij opvanguren > 0. Kindgebonden budget met kinderen < 18 en inkomen onder de grens.",
      sourceLabel: "Bron: Belastingdienst",
      sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/",
      labels: {
        zorg: { name: "Zorgtoeslag", tag: "MAANDELIJKS" },
        huur: { name: "Huurtoeslag", tag: "MAANDELIJKS" },
        kgb:  { name: "Kindgebonden budget", tag: "PER KIND" },
        kov:  { name: "Kinderopvangtoeslag", tag: "PER UUR" },
      },
    },
    plan: {
      eyebrow: "PRIJZEN",
      titleA: "Eerlijk geprijsd.",
      titleB: "Geen verrassingen.",
      sub: "Twee plannen: één voor zzp'ers, één voor BV's. Eerste maand altijd gratis.",
      tiers: [
        {
          name: "ZZP",
          tag: "VOOR ZZP & EENMANSZAAK",
          price: "€25,99",
          per: "/mnd · excl. BTW",
          desc: "Alles wat een zelfstandige nodig heeft om grip te houden op administratie en belasting.",
          cta: "Start gratis",
          features: [
            "Onbeperkt facturen & bonnen (UBL + PDF)",
            "Bankkoppeling via PSD2",
            "AI-categorisatie (suggesties, jij keurt goed)",
            "BTW-overzicht + aangifte voorbereiden",
            "Toeslagencheck (indicatie + aanvraag voorbereiden)",
            "Export naar accountant",
            "E-mailsupport",
          ],
        },
        {
          name: "BV",
          tag: "VOOR BV & HOLDING",
          price: "€49",
          per: "/mnd · excl. BTW",
          desc: "Voor BV's met meer fiscale verplichtingen. Voorbereiding van aangiftes en jaarrekening, exporteerbaar naar je accountant.",
          highlight: true,
          cta: "Start gratis",
          features: [
            "Alles uit ZZP",
            "ICP-opgave voorbereiden",
            "VPB-voorbereiding (export naar accountant)",
            "Jaarrekening-voorbereiding (export naar accountant)",
            "AI-auditscan: AI-controle van je boekjaar, exporteerbaar naar accountant",
            "Holding / werkmaatschappij ondersteuning",
            "Accountant-toegang met rollen",
            "API + SSO",
            "Prioriteit support",
          ],
        },
      ],
      disclaimer: "We bereiden voor en exporteren — de definitieve aangifte en jaarrekening blijft de verantwoordelijkheid van jou of je accountant.",
      referralHeading: "Deel het. Je prijs zakt mee.",
      referralSub: "Beschikbaar op beide plannen. Voor elke actieve referral gaat je maandprijs €1 omlaag.",
      steps: [
        { t: "Deel je link", d: "Eigen referralcode in je dashboard." },
        { t: "Vriend start", d: "Eerste maand gratis voor jullie beiden." },
        { t: "Prijs daalt", d: "Automatisch verrekend bij je volgende factuur." },
      ],
      foot: "Eerste maand gratis · Geen creditcard · Altijd opzegbaar · Excl. BTW",
    },
    finalCta: {
      titleA: "Begin bij",
      titleB: "helderheid.",
      sub: "Eerste maand gratis. Klaar binnen 2 minuten.",
      cta: "Start gratis",
      bullets: ["1e maand gratis", "Geen creditcard", "AVG-proof", "Altijd opzegbaar"],
    },
    footer: {
      copy: "© {year} CASH MAATJE",
      links: [
        { label: "PRIJZEN", to: "/pricing" },
        { label: "SECURITY", to: "/security" },
        { label: "COMPLIANCE", to: "/compliance" },
        { label: "OVER ONS", to: "/about" },
        { label: "PRIVACY", to: "/privacy" },
        { label: "VOORWAARDEN", to: "/terms" },
      ],
    },
  },
  en: {
    nav: { product: "PRODUCT", toeslagen: "BENEFITS CHECK", pricing: "PRICING", security: "SECURITY", signin: "LOG IN", start: "Get started" },
    hero: {
      badge: "First month free · no credit card",
      titleA: "Bookkeeping",
      titleB: "that thinks with you.",
      sub: "Invoices, receipts, VAT and financial insights automatically in one place. CashMaatje helps Dutch entrepreneurs stay in control of their money — without spreadsheet stress.",
      cta: "Start free",
      seeHow: "See demo",
      trustLine: "First month free · No credit card · GDPR-proof · EU hosting · Cancel anytime",
    },
    benefits: {
      items: [
        { eyebrow: "AUTOPILOT", title: "Hands-off admin", desc: "Receipts, bank and invoices processed automatically. You only approve." },
        { eyebrow: "TAX READY", title: "Always tax-ready", desc: "Real-time VAT and income tax reserve. You or your accountant files." },
        { eyebrow: "CLARITY", title: "One quiet view", desc: "Cash, profit and VAT in a single calm picture. No more loose spreadsheets." },
      ],
    },
    featuresHeading: { titleA: "Simplify", titleB: "your money.", sub: "Four core modules with concrete integrations that run your books silently." },
    feature: {
      items: [
        {
          label: "Invoicing",
          title: "Invoices that follow up themselves",
          desc: "Send professional invoices in PDF and UBL. Payment links via Mollie and Stripe. Automatic reminders.",
          bullets: ["UBL & PDF", "Mollie · Stripe payment links", "Auto reminders", "Small-business scheme support"],
        },
        {
          label: "Receipts & costs",
          title: "Automatic receipt recognition",
          desc: "Upload or email your receipt. CashMaatje extracts supplier, amount, VAT and category automatically. You just approve.",
          bullets: ["Per-company email inbox", "Mobile upload", "AI suggestion, you approve", "Audit trail per entry"],
        },
        {
          label: "Live dashboard",
          title: "Real-time cashflow",
          desc: "Secure PSD2 bank connection with all major Dutch banks. One view of profit, VAT and liquidity.",
          bullets: ["ING · Rabobank · ABN · Knab · bunq · Revolut", "Automatic reconciliation", "Cashflow forecast", "Profit per project/client"],
        },
        {
          label: "Tax reserve",
          title: "No more surprises",
          desc: "We calculate your VAT and income tax reserve automatically. You confirm every transfer — nothing happens without your approval.",
          bullets: ["VAT per quarter/month", "Income tax reserve (ZZP)", "Corporate tax reserve (BV)", "You confirm every action"],
        },
      ],
      integrationsLabel: "WORKS WITH",
      integrations: ["ING", "Rabobank", "ABN AMRO", "Knab", "bunq", "Revolut", "Mollie", "Stripe", "Shopify", "UBL export", "Exact export"],
    },
    ai: {
      eyebrow: "AI ASSISTANT",
      titleA: "Just ask",
      titleB: "Cash Maatje.",
      sub: "AI proposes, you stay in control. No action without your confirmation.",
      question: "How much VAT should I still reserve this quarter?",
      answer: "Your VAT reserve is €1,240 below your expected liability. Do you want to reserve this amount?",
      confirm: "Confirm reservation",
      later: "Later",
      foot: "Cash Maatje never moves money on its own. Every financial or tax action requires your explicit confirmation.",
    },
    socialProof: {
      eyebrow: "WHO IT'S FOR",
      line: "Built for Dutch freelancers and small BVs.",
      badge: "Currently in private beta with Dutch entrepreneurs",
    },
    toeslagen: {
      eyebrow: "BENEFITS CHECK",
      titleA: "Eligible for",
      titleB: "Dutch benefits?",
      sub: "Get an indication of possible allowances within seconds. The final assessment is always made by the Belastingdienst.",
      income: "Gross annual income",
      incomePh: "e.g. 28000",
      partner: "With fiscal partner",
      partnerIncome: "Partner income",
      kids: "Children under 18",
      rent: "Monthly rent (€)",
      rentPh: "e.g. 850",
      daycare: "Childcare hrs/month",
      daycarePh: "e.g. 80",
      resultTitle: "Your indication",
      perMonth: "/mo",
      noRight: "Fill in your details to see the indication.",
      indication: "INDICATION",
      apply: "Prepare application",
      foot: "Indication based on Belastingdienst thresholds 2026. No rights can be derived. Final assessment by the Belastingdienst.",
      rulesHint: "Healthcare allowance appears when income is below the threshold. Rent allowance from €250 rent. Childcare allowance when daycare hours > 0. Child budget with children < 18 and income below the threshold.",
      sourceLabel: "Source: Belastingdienst",
      sourceUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/",
      labels: {
        zorg: { name: "Healthcare allowance", tag: "MONTHLY" },
        huur: { name: "Rent allowance", tag: "MONTHLY" },
        kgb:  { name: "Child budget", tag: "PER CHILD" },
        kov:  { name: "Childcare allowance", tag: "PER HOUR" },
      },
    },
    plan: {
      eyebrow: "PRICING",
      titleA: "Fairly priced.",
      titleB: "No surprises.",
      sub: "Two plans: one for freelancers, one for BVs. First month always free.",
      tiers: [
        {
          name: "ZZP",
          tag: "FOR FREELANCERS",
          price: "€25.99",
          per: "/mo · excl. VAT",
          desc: "Everything a freelancer needs to stay in control of admin and tax.",
          cta: "Start free",
          features: [
            "Unlimited invoices & receipts (UBL + PDF)",
            "Bank connection via PSD2",
            "AI categorization (suggestions, you approve)",
            "VAT overview + return preparation",
            "Benefits check (indication + prepare application)",
            "Export to accountant",
            "Email support",
          ],
        },
        {
          name: "BV",
          tag: "FOR BV & HOLDING",
          price: "€49",
          per: "/mo · excl. VAT",
          desc: "For BVs with more fiscal obligations. Preparation of returns and annual report, exportable to your accountant.",
          highlight: true,
          cta: "Start free",
          features: [
            "Everything in ZZP",
            "ICP report preparation",
            "Corporate tax preparation (export to accountant)",
            "Annual report preparation (export to accountant)",
            "AI audit scan: AI review of your fiscal year, exportable to accountant",
            "Holding / operating company support",
            "Accountant access with roles",
            "API + SSO",
            "Priority support",
          ],
        },
      ],
      disclaimer: "We prepare and export — the final return and annual report remain the responsibility of you or your accountant.",
      referralHeading: "Share it. Your price drops.",
      referralSub: "Available on both plans. Every active referral lowers your monthly price by €1.",
      steps: [
        { t: "Share your link", d: "Your own referral code in the dashboard." },
        { t: "Friend signs up", d: "First month free for both of you." },
        { t: "Price drops", d: "Automatically applied on your next invoice." },
      ],
      foot: "First month free · No credit card · Cancel anytime · Excl. VAT",
    },
    finalCta: {
      titleA: "Start with",
      titleB: "clarity.",
      sub: "First month free. Setup in under 2 minutes.",
      cta: "Get started",
      bullets: ["First month free", "No credit card", "GDPR-proof", "Cancel anytime"],
    },
    footer: {
      copy: "© {year} CASH MAATJE",
      links: [
        { label: "PRICING", to: "/pricing" },
        { label: "SECURITY", to: "/security" },
        { label: "COMPLIANCE", to: "/compliance" },
        { label: "ABOUT", to: "/about" },
        { label: "PRIVACY", to: "/privacy" },
        { label: "TERMS", to: "/terms" },
      ],
    },
  },
};

/* ── Primitives ─────────────────────────────────────────────────── */

function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full border border-white/15">
      {(["nl", "en"] as Language[]).map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-stamp transition ${
            lang === code ? "bg-white text-black" : "text-white/60 hover:text-white"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

function PillCTA({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="origin-pill">
      {children} <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
    </Link>
  );
}

function GhostPill({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="origin-pill-ghost">
      {children}
    </Link>
  );
}

/* ── Nav ─────────────────────────────────────────────────────────── */

function Nav({ c }: { c: Copy }) {
  return (
    <header className="absolute top-0 inset-x-0 z-40">
      <div className="mx-auto max-w-[1200px] px-6 h-20 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="h-6 w-6 rounded-md bg-white grid place-items-center">
            <span className="text-black text-[12px] font-semibold">C</span>
          </div>
          <span className="text-[14px] tracking-stamp uppercase text-white">CASH MAATJE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg">
          {[
            { href: "#features", label: c.nav.product, internal: false },
            { href: "#toeslagen", label: c.nav.toeslagen, internal: false },
            { href: "#pricing", label: c.nav.pricing, internal: false },
            { href: "/security", label: c.nav.security, internal: true },
          ].map((l) =>
            l.internal ? (
              <Link key={l.href} to={l.href} className="px-3 py-1.5 rounded-lg text-[11px] font-stamp text-white/85 hover:text-white transition-colors">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="px-3 py-1.5 rounded-lg text-[11px] font-stamp text-white/85 hover:text-white transition-colors">
                {l.label}
              </a>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LangSwitch />
          <GhostPill to="/login">{c.nav.signin}</GhostPill>
          <PillCTA to="/register">{c.nav.start}</PillCTA>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────── */

function Hero({ c }: { c: Copy }) {
  return (
    <section className="relative overflow-hidden min-h-[100vh] flex items-center">
      <img
        src={duskSky}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1280}
        fetchPriority="high"
      />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-obsidian/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[55vh] bg-gradient-to-b from-transparent via-obsidian/70 to-obsidian" />

      <div className="relative mx-auto max-w-[1200px] px-6 w-full pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/25 backdrop-blur-md mb-10">
            <span className="text-[10px] font-stamp text-white">{c.hero.badge}</span>
          </div>

          <h1 className="text-display text-bone mx-auto max-w-5xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.35)]">
            <span className="text-italic-display">{c.hero.titleA}</span>{" "}
            <span className="font-display">{c.hero.titleB}</span>
          </h1>

          <p className="mt-8 text-subheading text-white/85 max-w-2xl mx-auto drop-shadow-[0_1px_20px_rgba(0,0,0,0.3)]">{c.hero.sub}</p>

          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <PillCTA to="/register">{c.hero.cta}</PillCTA>
            <a href="#features" className="origin-pill-ghost">{c.hero.seeHow}</a>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/15 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
            <span className="text-[11px] font-stamp text-white/85">{c.hero.trustLine}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Social Proof Strip (eerlijk, geen fake logo's) ─────────────── */

function SocialProofStrip({ c }: { c: Copy }) {
  return (
    <section className="border-y border-white/8">
      <div className="mx-auto max-w-[1200px] px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p className="text-micro text-frost">{c.socialProof.eyebrow}</p>
        <p className="font-display text-[20px] font-light text-bone">{c.socialProof.line}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-popover/40">
          <span className="h-1.5 w-1.5 rounded-full bg-bone animate-pulse" />
          <span className="text-[10px] font-stamp text-frost">{c.socialProof.badge}</span>
        </div>
      </div>
    </section>
  );
}

/* ── Section Heading ─────────────────────────────────────────────── */

function SectionHeading({ titleA, titleB, sub, eyebrow }: { titleA: string; titleB: string; sub?: string; eyebrow?: string }) {
  return (
    <div className="text-center mb-20">
      {eyebrow && <p className="text-micro text-frost mb-6">{eyebrow}</p>}
      <h2 className="text-heading-lg text-bone">
        <span className="text-italic-display">{titleA}</span>{" "}
        <span className="font-display">{titleB}</span>
      </h2>
      {sub && <p className="mt-6 text-subheading text-frost max-w-xl mx-auto">{sub}</p>}
    </div>
  );
}

/* ── Benefits ────────────────────────────────────────────────────── */

function BenefitsSection({ c }: { c: Copy }) {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-32">
      <div className="grid md:grid-cols-3 gap-6">
        {c.benefits.items.map((b) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-[30px] p-8 border border-white/5"
          >
            <p className="text-micro text-frost mb-6">{b.eyebrow}</p>
            <h3 className="font-display text-[28px] font-light text-bone leading-tight">{b.title}</h3>
            <p className="mt-3 text-body text-frost">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── Chromatic Feature Cards ─────────────────────────────────────── */

function Features({ c }: { c: Copy }) {
  const textures = [textureSand, textureMarble, textureWater, textureLavender];
  return (
    <section id="features" className="mx-auto max-w-[1200px] px-6 py-32">
      <SectionHeading titleA={c.featuresHeading.titleA} titleB={c.featuresHeading.titleB} sub={c.featuresHeading.sub} />
      <div className="grid md:grid-cols-2 gap-6">
        {c.feature.items.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[30px] min-h-[480px] flex flex-col justify-end p-8 group"
          >
            <img
              src={textures[i]}
              alt=""
              loading="lazy"
              width={1024}
              height={1280}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
            <p className="absolute top-7 left-8 text-[10px] font-stamp text-white/90">{card.label.toUpperCase()}</p>
            <div className="relative">
              <h3 className="font-display text-[26px] font-light text-bone leading-tight max-w-[320px]">{card.title}</h3>
              <p className="mt-3 text-body-sm text-white/80 max-w-[360px]">{card.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {card.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-caption text-white/85">
                    <Check className="w-3 h-3 mt-1 text-white shrink-0" strokeWidth={2.5} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 rounded-[24px] border border-white/8 bg-card/60 px-6 py-6 flex flex-col md:flex-row items-center gap-4 justify-between">
        <p className="text-micro text-frost shrink-0">{c.feature.integrationsLabel}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {c.feature.integrations.map((it) => (
            <span key={it} className="text-body-sm text-bone/80">{it}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── AI Section ──────────────────────────────────────────────────── */

function AiSection({ c }: { c: Copy }) {
  return (
    <section id="ai" className="bg-carbon border-y border-white/5">
      <div className="mx-auto max-w-[1200px] px-6 py-32">
        <SectionHeading eyebrow={c.ai.eyebrow} titleA={c.ai.titleA} titleB={c.ai.titleB} sub={c.ai.sub} />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto bg-card rounded-[30px] p-8 border border-white/5"
        >
          <div className="flex justify-end mb-4">
            <div className="bg-white text-carbon px-4 py-2.5 rounded-2xl rounded-br-md text-body-sm max-w-[80%]">
              {c.ai.question}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amethyst grid place-items-center shrink-0">
              <span className="text-white text-[12px] font-stamp">AI</span>
            </div>
            <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-md text-body-sm text-bone max-w-[80%] leading-relaxed">
              {c.ai.answer}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button className="px-3 py-1.5 rounded-full bg-white text-carbon text-[11px] font-stamp inline-flex items-center gap-1.5 hover:bg-white/90 transition">
                  <Check className="w-3 h-3" strokeWidth={2.5} /> {c.ai.confirm}
                </button>
                <button className="px-3 py-1.5 rounded-full border border-white/20 text-[11px] font-stamp text-bone/85 hover:border-white/40 transition">
                  {c.ai.later}
                </button>
              </div>
            </div>
          </div>
          <p className="mt-6 text-caption text-frost/80 text-center">{c.ai.foot}</p>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Toeslagen Check ────────────────────────────────────────────── */

function ToeslagenCheck({ c }: { c: Copy }) {
  const t = c.toeslagen;
  const [income, setIncome] = useState<number>(28000);
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerIncome, setPartnerIncome] = useState<number>(0);
  const [kids, setKids] = useState<number>(0);
  const [rent, setRent] = useState<number>(0);
  const [daycare, setDaycare] = useState<number>(0);

  const results = useMemo(() => {
    const totalIncome = income + (hasPartner ? partnerIncome : 0);
    const zorgCap = hasPartner ? 47000 : 37500;
    const zorgMax = hasPartner ? 243 : 127;
    const zorg = totalIncome > 0 && totalIncome < zorgCap
      ? Math.round(zorgMax * Math.max(0, 1 - totalIncome / zorgCap))
      : 0;
    const huurCap = hasPartner ? 33000 : 24000;
    const rentForCalc = Math.min(rent, 932.93);
    const huur = rent >= 250 && totalIncome > 0 && totalIncome < huurCap
      ? Math.round(Math.min(480, (rentForCalc - 250) * 0.65) * Math.max(0.2, 1 - totalIncome / huurCap))
      : 0;
    const kgbCap = hasPartner ? 50000 : 37500;
    const kgb = kids > 0 && totalIncome < kgbCap
      ? Math.round(kids * 105 * Math.max(0.4, 1 - totalIncome / (kgbCap * 1.4)))
      : 0;
    const kov = daycare > 0 && totalIncome < 200000
      ? Math.round(daycare * 8.5 * Math.max(0.33, 1 - totalIncome / 250000))
      : 0;
    return { zorg, huur, kgb, kov };
  }, [income, hasPartner, partnerIncome, kids, rent, daycare]);

  const items: { k: ToeslagKey; v: number }[] = [
    { k: "zorg", v: results.zorg },
    { k: "huur", v: results.huur },
    { k: "kgb",  v: results.kgb },
    { k: "kov",  v: results.kov },
  ];
  const eligible = items.filter((i) => i.v > 0);
  const total = eligible.reduce((s, i) => s + i.v, 0);

  const inputClass =
    "w-full bg-popover border border-white/10 rounded-2xl px-4 py-3 text-body-sm text-bone placeholder:text-frost/60 focus:outline-none focus:border-white/30 transition";

  return (
    <section id="toeslagen" className="relative bg-carbon border-y border-white/5">
      <div className="mx-auto max-w-[1200px] px-6 py-28">
        <SectionHeading eyebrow={t.eyebrow} titleA={t.titleA} titleB={t.titleB} sub={t.sub} />
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="rounded-[30px] bg-card border border-white/5 p-8 shadow-feature"
          >
            <div className="space-y-5">
              <div>
                <label className="block text-micro text-frost mb-2">{t.income}</label>
                <input type="number" inputMode="numeric" value={income || ""} onChange={(e) => setIncome(Number(e.target.value) || 0)} placeholder={t.incomePh} className={inputClass} />
              </div>
              <div className="flex items-center justify-between gap-4 py-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <button type="button" onClick={() => setHasPartner((v) => !v)} className={`relative w-10 h-6 rounded-full transition ${hasPartner ? "bg-bone" : "bg-white/10"}`} aria-pressed={hasPartner}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-carbon transition ${hasPartner ? "translate-x-4" : ""}`} />
                  </button>
                  <span className="text-body-sm text-bone">{t.partner}</span>
                </label>
              </div>
              {hasPartner && (
                <div>
                  <label className="block text-micro text-frost mb-2">{t.partnerIncome}</label>
                  <input type="number" inputMode="numeric" value={partnerIncome || ""} onChange={(e) => setPartnerIncome(Number(e.target.value) || 0)} placeholder={t.incomePh} className={inputClass} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-micro text-frost mb-2">{t.kids}</label>
                  <input type="number" min={0} value={kids || ""} onChange={(e) => setKids(Math.max(0, Number(e.target.value) || 0))} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className="block text-micro text-frost mb-2">{t.rent}</label>
                  <input type="number" value={rent || ""} onChange={(e) => setRent(Number(e.target.value) || 0)} placeholder={t.rentPh} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-micro text-frost mb-2">{t.daycare}</label>
                <input type="number" value={daycare || ""} onChange={(e) => setDaycare(Number(e.target.value) || 0)} placeholder={t.daycarePh} className={inputClass} />
              </div>
              <div className="rounded-2xl bg-popover/60 border border-white/5 p-4">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-frost shrink-0 mt-0.5" />
                  <p className="text-[11px] font-stamp text-frost leading-relaxed">{t.rulesHint}</p>
                </div>
                <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[11px] font-stamp text-bone underline underline-offset-2 decoration-white/20 hover:decoration-white/60 transition">{t.sourceLabel}</a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-[30px] bg-card border border-white/5 p-8 shadow-feature flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-micro text-frost">{t.resultTitle}</p>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/15 text-[10px] font-stamp text-bone">
                <Sparkles className="w-3 h-3" /> {t.indication}
              </span>
            </div>
            <div className="flex items-end gap-3 mb-6">
              <span className="font-display text-[64px] font-light leading-none text-bone">€{total}</span>
              <span className="text-body-sm text-frost pb-2">{t.perMonth}</span>
            </div>
            <div className="space-y-2 mb-6">
              {items.map((i) => {
                const isEligible = i.v > 0;
                const label = t.labels[i.k];
                return (
                  <div key={i.k} className={`flex items-center justify-between py-3 px-4 rounded-2xl border transition ${isEligible ? "bg-amethyst/10 border-amethyst/30" : "bg-popover/60 border-white/5 opacity-55"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isEligible ? "bg-amethyst animate-pulse" : "bg-white/20"}`} />
                      <div className="min-w-0">
                        <p className="text-body-sm text-bone truncate">{label.name}</p>
                        <p className="text-[10px] font-stamp text-frost">{label.tag} · {t.indication}</p>
                      </div>
                    </div>
                    <span className={`font-display text-[18px] font-light ${isEligible ? "text-bone" : "text-frost/60"}`}>{isEligible ? `~ €${i.v}` : "—"}</span>
                  </div>
                );
              })}
            </div>
            {eligible.length > 0 ? (
              <div className="mt-auto"><PillCTA to="/register">{t.apply}</PillCTA></div>
            ) : (
              <p className="mt-auto text-caption text-frost">{t.noRight}</p>
            )}
            <p className="mt-5 text-[10px] text-frost/70 leading-relaxed">{t.foot}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── Pricing + Referral (2 tiers, merged) ───────────────────────── */

function PlanReferralSection({ c }: { c: Copy }) {
  const p = c.plan;
  return (
    <section id="pricing" className="bg-carbon border-y border-white/5">
      <div className="mx-auto max-w-[1200px] px-6 py-32">
        <SectionHeading eyebrow={p.eyebrow} titleA={p.titleA} titleB={p.titleB} sub={p.sub} />

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {p.tiers.map((tier) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className={`rounded-[30px] bg-card p-10 shadow-feature flex flex-col ${tier.highlight ? "border-2 border-amethyst/50" : "border border-white/5"}`}
            >
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span className="px-2.5 py-1 rounded-full border border-white/15 text-[10px] font-stamp text-bone">{tier.tag}</span>
                {tier.highlight && (
                  <span className="px-2.5 py-1 rounded-full bg-amethyst text-white text-[10px] font-stamp">POPULAIR</span>
                )}
              </div>
              <h3 className="font-display text-[28px] font-light text-bone leading-tight">{tier.name}</h3>
              <p className="mt-3 text-body-sm text-frost min-h-[44px]">{tier.desc}</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-display text-[64px] font-light leading-none text-bone">{tier.price}</span>
                <span className="text-body-sm text-frost pb-2">{tier.per}</span>
              </div>
              <div className="my-6 h-px bg-white/8" />
              <ul className="space-y-2.5 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-body-sm text-bone">
                    <Check className="w-4 h-4 mt-0.5 text-bone shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <PillCTA to="/register">{tier.cta}</PillCTA>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-caption text-frost max-w-2xl mx-auto italic">{p.disclaimer}</p>
        <p className="mt-4 text-center text-caption text-frost">{p.foot}</p>

        <div className="my-20 flex items-center gap-6 max-w-3xl mx-auto">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-micro text-frost">REFERRAL</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="max-w-3xl mx-auto text-center mb-12">
          <h3 className="font-display text-[36px] font-light text-bone leading-tight">{p.referralHeading}</h3>
          <p className="mt-4 text-body text-frost max-w-md mx-auto">{p.referralSub}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {p.steps.map((s, i) => (
            <div key={s.t} className="rounded-[30px] border border-white/5 bg-card p-8">
              <p className="font-mono text-caption text-frost mb-5">{String(i + 1).padStart(2, "0")}</p>
              <h4 className="font-display text-[22px] font-light text-bone">{s.t}</h4>
              <p className="mt-3 text-body-sm text-frost">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Security Teaser ─────────────────────────────────────────────── */

function SecurityTeaser({ c }: { c: Copy }) {
  const items = [
    { icon: Lock, label: c.nav.security === "SECURITY" ? "Versleuteld at rest & in transit" : "Encrypted at rest & in transit" },
    { icon: Server, label: "EU-hosting · AVG / GDPR" },
    { icon: ShieldCheck, label: c.nav.security === "SECURITY" ? "Data-isolatie per bedrijf" : "Per-company data isolation" },
    { icon: FileCheck2, label: c.nav.security === "SECURITY" ? "Audit logs & rollen" : "Audit logs & roles" },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24">
      <div className="rounded-[30px] bg-card border border-white/5 p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-micro text-frost mb-3">SECURITY & COMPLIANCE</p>
            <h2 className="font-display text-[36px] font-light text-bone leading-tight max-w-xl">
              <span className="text-italic-display">Vertrouwd</span> met je boekhouding.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/security" className="origin-pill-ghost">Security</Link>
            <Link to="/compliance" className="origin-pill-ghost">Compliance</Link>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((it) => (
            <div key={it.label} className="rounded-2xl bg-popover/60 border border-white/5 p-5">
              <it.icon className="w-5 h-5 text-bone mb-3" strokeWidth={1.5} />
              <p className="text-body-sm text-bone leading-snug">{it.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ───────────────────────────────────────────────────── */

function FinalCta({ c }: { c: Copy }) {
  return (
    <section className="relative overflow-hidden">
      <img src={duskSky} alt="" className="absolute inset-0 w-full h-full object-cover scale-y-[-1]" />
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/40 to-obsidian/85" />
      <div className="relative mx-auto max-w-3xl px-6 py-40 text-center">
        <h2 className="text-heading-lg text-bone">
          <span className="text-italic-display">{c.finalCta.titleA}</span>{" "}
          <span className="font-display">{c.finalCta.titleB}</span>
        </h2>
        <p className="mt-6 text-subheading text-frost max-w-md mx-auto">{c.finalCta.sub}</p>
        <div className="mt-10 flex items-center justify-center">
          <PillCTA to="/register">{c.finalCta.cta}</PillCTA>
        </div>
        <div className="mt-10 flex items-center justify-center gap-6 text-caption text-frost flex-wrap">
          {c.finalCta.bullets.map((x) => (
            <span key={x} className="inline-flex items-center gap-1.5">
              <Check className="w-3 h-3" /> {x}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────── */

function Footer({ c }: { c: Copy }) {
  return (
    <footer className="border-t border-white/5 bg-obsidian">
      <div className="mx-auto max-w-[1200px] px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-white grid place-items-center">
            <span className="text-black text-[10px] font-semibold">C</span>
          </div>
          <span className="text-caption font-stamp text-frost">{c.footer.copy.replace("{year}", String(new Date().getFullYear()))}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-stamp text-frost justify-center">
          {c.footer.links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-bone transition-colors">{l.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function Landing() {
  const { lang } = useI18n();
  const c = copy[lang];
  return (
    <div className="min-h-screen bg-obsidian text-bone">
      <Nav c={c} />
      <Hero c={c} />
      <ToeslagenCheck c={c} />
      <SocialProofStrip c={c} />
      <BenefitsSection c={c} />
      <Features c={c} />
      <AiSection c={c} />
      <SecurityTeaser c={c} />
      <PlanReferralSection c={c} />
      <FinalCta c={c} />
      <Footer c={c} />
    </div>
  );
}
