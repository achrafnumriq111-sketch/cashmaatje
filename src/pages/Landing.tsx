import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  FileText,
  Receipt,
  LineChart,
  Calculator,
  Check,
  Star,
  Users,
} from "lucide-react";
import { useI18n, type Language } from "@/lib/i18n";

/* ──────────────────────────────────────────────────────────────
   Cash Maatje — Landing (NL default, EN toggle)
   ────────────────────────────────────────────────────────────── */

type Copy = {
  nav: { features: string; ai: string; referral: string; pricing: string; signin: string; start: string };
  hero: {
    badge: string;
    titleA: string;
    titleB: string;
    sub: string;
    perMonth: string;
    firstFree: string;
    cta: string;
    seeHow: string;
    disclaimer: string;
  };
  preview: { month: string; reserved: string; paid: string; pending: string; vatQ: string; filed: string };
  trust: { line: string; reviews: string };
  benefits: { items: { title: string; desc: string }[] };
  features: {
    invoicing: { eyebrow: string; title: string; desc: string; sent: string };
    expenses: { eyebrow: string; title: string; desc: string; cat: { travel: string; software: string; meals: string; hosting: string } };
    dashboard: { eyebrow: string; title: string; desc: string; revenue: string; profit: string; reserved: string };
    tax: { eyebrow: string; title: string; desc: string; owe: string; reserved: string; safe: string };
  };
  ai: { eyebrow: string; title: string; sub: string; question: string; answer: string };
  testimonials: { items: { q: string; n: string; r: string }[] };
  referral: {
    eyebrow: string; titleA: string; titleB: string; sub: string;
    steps: { t: string; d: string }[];
    yourPrice: string; live: string; rows: { r: string; p: string }[]; foot: string;
  };
  pricing: {
    eyebrow: string; title: string; sub: string; allIn: string; firstFree: string;
    firstMonth: string; thenA: string; thenB: string; thenC: string;
    cta: string; features: string[]; base: string; perRef: string; floor: string; foot: string;
  };
  finalCta: { title: string; sub: string; cta: string; bullets: string[] };
};

const copy: Record<Language, Copy> = {
  nl: {
    nav: { features: "Features", ai: "AI", referral: "Referral", pricing: "Prijzen", signin: "Inloggen", start: "Gratis starten" },
    hero: {
      badge: "Nu met AI belasting-assistent",
      titleA: "Jouw geld.",
      titleB: "Helder. In controle.",
      sub: "Facturen, kosten en belastingen — automatisch geregeld.",
      perMonth: "/maand",
      firstFree: "1e maand gratis",
      cta: "Probeer 1 maand gratis",
      seeHow: "Bekijk hoe het werkt",
      disclaimer:
        "Eerste maand volledig gratis — geen creditcard. Daarna: vanaf €25,99/maand, zakt €1 per actieve referral, tot €15,99/maand na 10 referrals. Altijd opzegbaar.",
    },
    preview: { month: "November", reserved: "Gereserveerd voor belasting", paid: "Betaald", pending: "Open", vatQ: "BTW dit kwartaal", filed: "Automatisch ingediend" },
    trust: { line: "Vertrouwd door moderne ondernemers", reviews: "4.9 · 320+ reviews" },
    benefits: {
      items: [
        { title: "Alles geautomatiseerd", desc: "Van bonnen tot aangiftes — geen handwerk." },
        { title: "Altijd belasting-klaar", desc: "Realtime belastingreserve. Geen verrassingen." },
        { title: "Realtime inzicht", desc: "Weet je cijfers, elke dag." },
      ],
    },
    features: {
      invoicing: { eyebrow: "Facturen", title: "Verstuur facturen in seconden.", desc: "Strak, branded en sneller betaald. Herinneringen gaan automatisch.", sent: "Verstuurd" },
      expenses: { eyebrow: "Kosten", title: "Bonnen erin. Gecategoriseerd eruit.", desc: "Maak een foto of stuur een mail door. AI plaatst het op de juiste plek.", cat: { travel: "Reizen", software: "Software", meals: "Eten", hosting: "Hosting" } },
      dashboard: { eyebrow: "Dashboard", title: "Je bedrijf, in één oogopslag.", desc: "Omzet, winst, runway. Eén scherm. Altijd actueel.", revenue: "Omzet", profit: "Winst", reserved: "Gereserveerd" },
      tax: { eyebrow: "Belastingoverzicht", title: "Weet altijd wat van jou is.", desc: "Zie wat je moet betalen, wat gereserveerd is en wat je veilig kunt uitgeven.", owe: "Te betalen", reserved: "Gereserveerd", safe: "Vrij te besteden" },
    },
    ai: {
      eyebrow: "AI Assistent",
      title: "Vraag het gewoon.",
      sub: "Je cijfers, in gewone taal. Op elk moment.",
      question: "Hoeveel belasting moet ik betalen?",
      answer: "Je moet €4.820 BTW betalen dit kwartaal. Het is al gereserveerd — uiterlijk 31 jan.",
    },
    testimonials: {
      items: [
        { q: "Boekhouding is van mijn lijst verdwenen. Eindelijk.", n: "Sara V.", r: "Oprichter, Studio Nord" },
        { q: "Ik zie precies wat ik kan uitgeven. Geen stress meer.", n: "Mark D.", r: "Freelance developer" },
        { q: "Aangiftes kostten een weekend. Nu: niets.", n: "Lena K.", r: "Eigenaar, Atelier" },
      ],
    },
    referral: {
      eyebrow: "Referrals", titleA: "Neem een vriend mee.", titleB: "Betaal elke maand minder.",
      sub: "Elke actieve referral verlaagt je maandbedrag met €1 — tot wel €15,99/maand.",
      steps: [
        { t: "Deel je link", d: "Elk account heeft een unieke referral-link." },
        { t: "Vriend abonneert", d: "Ze melden zich aan en starten hun plan." },
        { t: "Jullie sparen samen", d: "€1 korting per maand voor elke actieve referral." },
      ],
      yourPrice: "Jouw maandprijs", live: "Live voorbeeld",
      rows: [
        { r: "0 referrals", p: "€ 25,99" }, { r: "3 referrals", p: "€ 22,99" },
        { r: "7 referrals", p: "€ 18,99" }, { r: "10+ referrals", p: "€ 15,99" },
      ],
      foot: "Referral telt na hun eerste succesvolle betaling. Korting wordt automatisch verrekend.",
    },
    pricing: {
      eyebrow: "Prijzen", title: "Eén plan. Alles erin.",
      sub: "Eerste maand gratis — daarna €25,99/maand, zakt naar €15,99 met actieve referrals. Extra entiteiten €15,99/maand per stuk.",
      allIn: "All-in plan", firstFree: "1e maand gratis",
      firstMonth: "eerste maand", thenA: "Daarna ", thenB: "€25,99/maand", thenC: " — al vanaf €15,99 met 10 actieve referrals.",
      cta: "Probeer 1 maand gratis",
      features: [
        "Onbeperkte facturen & kosten",
        "Bankkoppelingen + AI-matching",
        "BTW-aangifte (kwartaal/maand) + ICP",
        "Volledige AI-boekhoud-autopilot",
        "Jaarrekening, audit dossier, VPB",
        "Stakeholder CRM + Corporate Structure",
        "Automation Center & Process Flows",
        "Accountant-toegang + API",
      ],
      base: "Basis", perRef: "Per referral", floor: "Minimum",
      foot: "Eerste maand gratis · Geen creditcard · Altijd opzegbaar · Excl. BTW",
    },
    finalCta: {
      title: "Start je bedrijf met helderheid.",
      sub: "Eerste maand gratis. Setup in minder dan 2 minuten.",
      cta: "Probeer 1 maand gratis",
      bullets: ["Eerste maand gratis", "Geen creditcard", "Altijd opzegbaar"],
    },
  },
  en: {
    nav: { features: "Features", ai: "AI", referral: "Referral", pricing: "Pricing", signin: "Sign in", start: "Start free" },
    hero: {
      badge: "Now with AI tax assistant",
      titleA: "Your money.", titleB: "Clear. Controlled.",
      sub: "Invoices, expenses and taxes — handled automatically.",
      perMonth: "/month", firstFree: "1st month free",
      cta: "Try free for 1 month", seeHow: "See how it works",
      disclaimer:
        "First month completely free — no credit card. After the trial: starts at €25,99/month, drops €1 per active referral, down to €15,99/month after 10 referrals. Cancel anytime.",
    },
    preview: { month: "November", reserved: "Tax reserved", paid: "Paid", pending: "Pending", vatQ: "VAT this quarter", filed: "Filed automatically" },
    trust: { line: "Trusted by modern entrepreneurs", reviews: "4.9 · 320+ reviews" },
    benefits: {
      items: [
        { title: "Everything automated", desc: "From receipts to filings — no manual work." },
        { title: "Always tax ready", desc: "Real-time tax reserve. No surprises." },
        { title: "Real-time clarity", desc: "Know your numbers, every day." },
      ],
    },
    features: {
      invoicing: { eyebrow: "Invoicing", title: "Send invoices in seconds.", desc: "Beautiful, branded, and paid faster. Reminders go out automatically.", sent: "Sent" },
      expenses: { eyebrow: "Expenses", title: "Receipts in. Categorized out.", desc: "Snap a photo or forward an email. AI files it in the right place.", cat: { travel: "Travel", software: "Software", meals: "Meals", hosting: "Hosting" } },
      dashboard: { eyebrow: "Dashboard", title: "Your business, at a glance.", desc: "Revenue, profit, runway. One screen. Always up to date.", revenue: "Revenue", profit: "Profit", reserved: "Reserved" },
      tax: { eyebrow: "Tax overview", title: "Always know what's yours.", desc: "See what you owe, what's reserved, and what's safe to spend.", owe: "You owe", reserved: "Reserved", safe: "Safe to spend" },
    },
    ai: {
      eyebrow: "AI Assistant", title: "Just ask.",
      sub: "Your numbers, in plain language. Anytime.",
      question: "How much tax do I owe?",
      answer: "You owe €4,820 in VAT this quarter. It's already reserved — due Jan 31.",
    },
    testimonials: {
      items: [
        { q: "Bookkeeping disappeared from my to-do list. Finally.", n: "Sara V.", r: "Founder, Studio Nord" },
        { q: "I see exactly what I can spend. No more anxiety.", n: "Mark D.", r: "Freelance developer" },
        { q: "Tax filings used to take a weekend. Now: zero.", n: "Lena K.", r: "Owner, Atelier" },
      ],
    },
    referral: {
      eyebrow: "Referrals", titleA: "Bring a friend.", titleB: "Pay less every month.",
      sub: "Every active referral lowers your monthly bill by €1 — all the way down to €15,99/month.",
      steps: [
        { t: "Share your link", d: "Each account gets a unique referral link." },
        { t: "Friend subscribes", d: "They sign up and start their plan." },
        { t: "You both save", d: "€1 off your monthly price for every active referral." },
      ],
      yourPrice: "Your monthly price", live: "Live example",
      rows: [
        { r: "0 referrals", p: "€ 25,99" }, { r: "3 referrals", p: "€ 22,99" },
        { r: "7 referrals", p: "€ 18,99" }, { r: "10+ referrals", p: "€ 15,99" },
      ],
      foot: "Referral counts after their first successful payment. Discount auto-applied to your next invoice.",
    },
    pricing: {
      eyebrow: "Pricing", title: "One plan. Everything in.",
      sub: "First month free — then €25,99/month, dropping to €15,99 with active referrals. Extra entities are €15,99/month each.",
      allIn: "All-in plan", firstFree: "1st month free",
      firstMonth: "first month", thenA: "Then ", thenB: "€25,99/month", thenC: " — as low as €15,99 with 10 active referrals.",
      cta: "Try free for 1 month",
      features: [
        "Unlimited invoices & expenses",
        "Bank connections + AI matching",
        "VAT returns (quarterly/monthly) + ICP",
        "Full AI bookkeeping autopilot",
        "Annual report, audit dossier, CIT",
        "Stakeholder CRM + Corporate Structure",
        "Automation Center & Process Flows",
        "Accountant access + API",
      ],
      base: "Base", perRef: "Per referral", floor: "Floor",
      foot: "First month free · No credit card · Cancel anytime · Excl. VAT",
    },
    finalCta: {
      title: "Start your business with clarity.",
      sub: "First month free. Setup in under 2 minutes.",
      cta: "Try free for 1 month",
      bullets: ["First month free", "No credit card", "Cancel anytime"],
    },
  },
};

function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-secondary border border-border">
      {(["nl", "en"] as Language[]).map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide transition ${
            lang === code ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={`Switch to ${code.toUpperCase()}`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

function Nav({ c }: { c: Copy }) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-primary grid place-items-center">
            <span className="text-primary-foreground text-[13px] font-semibold">C</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Cash Maatje</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[14px] text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">{c.nav.features}</a>
          <a href="#ai" className="hover:text-foreground transition-colors">{c.nav.ai}</a>
          <a href="#referral" className="hover:text-foreground transition-colors">{c.nav.referral}</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">{c.nav.pricing}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch />
          <Link to="/login" className="text-[13px] md:text-[14px] text-muted-foreground hover:text-foreground px-2 md:px-3 py-2 whitespace-nowrap">
            {c.nav.signin}
          </Link>
          <Link
            to="/register"
            className="text-[13px] md:text-[14px] font-medium bg-foreground text-background px-3 md:px-4 py-2 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {c.nav.start}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ c }: { c: Copy }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--primary-soft))] text-primary text-[12px] font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            {c.hero.badge}
          </div>
          <h1 className="text-[44px] md:text-[64px] font-semibold tracking-[-0.03em] leading-[1.02] text-foreground">
            {c.hero.titleA}<br />
            <span className="text-primary">{c.hero.titleB}</span>
          </h1>
          <p className="mt-6 text-[18px] text-muted-foreground max-w-md leading-relaxed">{c.hero.sub}</p>
          <div className="mt-8 flex items-baseline gap-3 flex-wrap">
            <span className="text-[44px] font-semibold tracking-[-0.03em] leading-none text-foreground">
              €15,99<sup className="text-primary text-[20px] font-medium ml-0.5">*</sup>
            </span>
            <span className="text-[14px] text-muted-foreground">{c.hero.perMonth}</span>
            <span className="ml-1 inline-flex items-center px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold uppercase tracking-wide">
              {c.hero.firstFree}
            </span>
          </div>
          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-primary/90 transition-colors"
            >
              {c.hero.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-foreground px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-secondary transition-colors"
            >
              {c.hero.seeHow}
            </a>
          </div>
          <p className="mt-6 text-[12px] text-muted-foreground/80 max-w-md leading-relaxed">
            <span className="text-primary">*</span> {c.hero.disclaimer}
          </p>
        </motion.div>

        <HeroPreview c={c} />
      </div>
    </section>
  );
}

function HeroPreview({ c }: { c: Copy }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative bg-card rounded-3xl border border-border shadow-[0_30px_80px_-30px_rgba(15,123,108,0.18),0_8px_24px_-12px_rgba(17,17,17,0.08)] p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{c.preview.month}</p>
            <p className="text-[22px] font-semibold tracking-tight text-foreground mt-0.5">€ 28.540</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{c.preview.reserved}</p>
            <p className="text-[22px] font-semibold tracking-tight text-primary mt-0.5">€ 5.420</p>
          </div>
        </div>

        <svg viewBox="0 0 320 80" className="w-full h-20">
          <defs>
            <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,60 C40,55 60,40 90,38 C130,35 150,55 180,48 C210,42 240,18 280,22 L320,15 L320,80 L0,80 Z" fill="url(#g)" />
          <path d="M0,60 C40,55 60,40 90,38 C130,35 150,55 180,48 C210,42 240,18 280,22 L320,15"
            fill="none" stroke="hsl(var(--primary))" strokeWidth="1.75" strokeLinecap="round" />
        </svg>

        <div className="mt-5 space-y-2.5">
          {[
            { label: "Acme Studio", amount: "€ 2.400", paid: true },
            { label: "Northwind Co.", amount: "€ 1.180", paid: true },
            { label: "Globex", amount: "€ 980", paid: false },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-[11px] font-medium text-foreground">
                  {r.label[0]}
                </div>
                <span className="text-[14px] text-foreground">{r.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-foreground">{r.amount}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  r.paid ? "bg-[hsl(var(--primary-soft))] text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {r.paid ? c.preview.paid : c.preview.pending}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl shadow-[0_20px_40px_-20px_rgba(17,17,17,0.15)] px-4 py-3 flex items-center gap-3"
      >
        <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary-soft))] grid place-items-center">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{c.preview.vatQ}</p>
          <p className="text-[13px] font-semibold text-foreground">{c.preview.filed}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TrustStrip({ c }: { c: Copy }) {
  return (
    <section className="border-y border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[13px] text-muted-foreground">{c.trust.line}</p>
        <div className="flex items-center gap-8 text-[13px] text-muted-foreground/80 font-medium">
          <span>Acme</span><span>Northwind</span><span>Globex</span><span>Initech</span><span>Hooli</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-foreground text-foreground" />
            ))}
          </div>
          <span className="text-[13px] text-muted-foreground">{c.trust.reviews}</span>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection({ c }: { c: Copy }) {
  const icons = [Zap, ShieldCheck, LineChart];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid md:grid-cols-3 gap-10">
        {c.benefits.items.map((b, i) => {
          const Icon = icons[i];
          return (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--primary-soft))] grid place-items-center mb-5">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-foreground">{b.title}</h3>
              <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function FeatureRow({
  eyebrow, title, desc, reverse, children,
}: {
  eyebrow: string; title: string; desc: string; reverse?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`grid lg:grid-cols-2 gap-16 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-[12px] uppercase tracking-wider font-medium text-primary mb-4">{eyebrow}</p>
        <h2 className="text-[36px] md:text-[44px] font-semibold tracking-[-0.02em] leading-[1.05] text-foreground">{title}</h2>
        <p className="mt-5 text-[16px] text-muted-foreground leading-relaxed max-w-md">{desc}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card rounded-3xl border border-border shadow-[0_20px_60px_-30px_rgba(17,17,17,0.12)] p-6"
      >
        {children}
      </motion.div>
    </div>
  );
}

function Features({ c }: { c: Copy }) {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 space-y-32">
      <FeatureRow eyebrow={c.features.invoicing.eyebrow} title={c.features.invoicing.title} desc={c.features.invoicing.desc}>
        <div className="space-y-3">
          {[
            { co: "Acme Studio", a: "€ 2.400,00", s: c.preview.paid },
            { co: "Northwind Co.", a: "€ 1.180,00", s: c.preview.paid },
            { co: "Globex", a: "€ 980,00", s: c.preview.pending },
            { co: "Initech", a: "€ 3.200,00", s: c.features.invoicing.sent },
          ].map((r) => (
            <div key={r.co} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-secondary/60">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-[14px] text-foreground">{r.co}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[13px] text-foreground font-medium">{r.a}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  r.s === c.preview.paid ? "bg-[hsl(var(--primary-soft))] text-primary" : "bg-secondary text-muted-foreground"
                }`}>{r.s}</span>
              </div>
            </div>
          ))}
        </div>
      </FeatureRow>

      <FeatureRow eyebrow={c.features.expenses.eyebrow} title={c.features.expenses.title} desc={c.features.expenses.desc} reverse>
        <div className="space-y-2.5">
          {[
            { n: "Uber", cat: c.features.expenses.cat.travel, a: "€ 24,50" },
            { n: "Notion", cat: c.features.expenses.cat.software, a: "€ 12,00" },
            { n: "Espresso Bar", cat: c.features.expenses.cat.meals, a: "€ 8,40" },
            { n: "AWS", cat: c.features.expenses.cat.hosting, a: "€ 142,00" },
          ].map((e) => (
            <div key={e.n} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/60">
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4 text-muted-foreground" />
                <span className="text-[14px] text-foreground">{e.n}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary-soft))] text-primary font-medium">{e.cat}</span>
              </div>
              <span className="text-[13px] font-medium text-foreground">{e.a}</span>
            </div>
          ))}
        </div>
      </FeatureRow>

      <FeatureRow eyebrow={c.features.dashboard.eyebrow} title={c.features.dashboard.title} desc={c.features.dashboard.desc}>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { l: c.features.dashboard.revenue, v: "€ 28,5k" },
            { l: c.features.dashboard.profit, v: "€ 11,2k" },
            { l: c.features.dashboard.reserved, v: "€ 5,4k" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{s.l}</p>
              <p className="text-[18px] font-semibold tracking-tight text-foreground mt-1">{s.v}</p>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 320 80" className="w-full h-20">
          <path d="M0,55 C40,50 70,30 110,32 C150,35 180,55 220,42 C260,30 290,18 320,20"
            fill="none" stroke="hsl(var(--primary))" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </FeatureRow>

      <FeatureRow eyebrow={c.features.tax.eyebrow} title={c.features.tax.title} desc={c.features.tax.desc} reverse>
        <div className="space-y-3">
          {[
            { l: c.features.tax.owe, v: "€ 4.820", tone: "neutral" },
            { l: c.features.tax.reserved, v: "€ 5.420", tone: "primary" },
            { l: c.features.tax.safe, v: "€ 18.300", tone: "primary" },
          ].map((r) => (
            <div key={r.l} className="flex items-center justify-between py-3 px-4 rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <Calculator className="w-4 h-4 text-muted-foreground" />
                <span className="text-[14px] text-foreground">{r.l}</span>
              </div>
              <span className={`text-[15px] font-semibold tracking-tight ${
                r.tone === "primary" ? "text-primary" : "text-foreground"
              }`}>{r.v}</span>
            </div>
          ))}
        </div>
      </FeatureRow>
    </section>
  );
}

function AiSection({ c }: { c: Copy }) {
  return (
    <section id="ai" className="bg-secondary/40 border-y border-border/60">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <p className="text-[12px] uppercase tracking-wider font-medium text-primary mb-4">{c.ai.eyebrow}</p>
        <h2 className="text-[40px] md:text-[52px] font-semibold tracking-[-0.025em] leading-[1.05] text-foreground">
          {c.ai.title}
        </h2>
        <p className="mt-5 text-[17px] text-muted-foreground max-w-lg mx-auto">{c.ai.sub}</p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 max-w-xl mx-auto bg-card rounded-3xl border border-border shadow-[0_20px_60px_-30px_rgba(17,17,17,0.15)] p-6 text-left"
        >
          <div className="flex justify-end mb-4">
            <div className="bg-foreground text-background px-4 py-2.5 rounded-2xl rounded-br-md text-[14px] max-w-[80%]">
              {c.ai.question}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-primary grid place-items-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md text-[14px] text-foreground max-w-[80%] leading-relaxed">
              {c.ai.answer}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Testimonials({ c }: { c: Copy }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid md:grid-cols-3 gap-6">
        {c.testimonials.items.map((t) => (
          <motion.div
            key={t.n}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border bg-card p-7 cm-hover-lift"
          >
            <div className="flex mb-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-foreground text-foreground" />
              ))}
            </div>
            <p className="text-[16px] text-foreground leading-relaxed">"{t.q}"</p>
            <div className="mt-6">
              <p className="text-[13px] font-medium text-foreground">{t.n}</p>
              <p className="text-[12px] text-muted-foreground">{t.r}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ReferralSection({ c }: { c: Copy }) {
  return (
    <section id="referral" className="mx-auto max-w-6xl px-6 py-28">
      <div className="text-center mb-16">
        <p className="text-[12px] uppercase tracking-wider font-medium text-primary mb-4">{c.referral.eyebrow}</p>
        <h2 className="text-[40px] md:text-[52px] font-semibold tracking-[-0.025em] leading-[1.05] text-foreground">
          {c.referral.titleA}<br/>
          <span className="text-primary">{c.referral.titleB}</span>
        </h2>
        <p className="mt-5 text-[17px] text-muted-foreground max-w-xl mx-auto">{c.referral.sub}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {c.referral.steps.map((s, i) => (
          <div key={s.t} className="rounded-3xl border border-border bg-card p-7">
            <p className="text-[12px] font-mono text-primary mb-4">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="text-[18px] font-semibold tracking-tight text-foreground">{s.t}</h3>
            <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-border bg-card p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Users className="w-4 h-4" /> {c.referral.yourPrice}
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary-soft))] text-primary font-medium">
            {c.referral.live}
          </span>
        </div>
        <div className="space-y-2">
          {c.referral.rows.map((row, i) => {
            const best = i === c.referral.rows.length - 1;
            return (
              <div key={row.r} className={`flex items-center justify-between py-3 px-4 rounded-2xl ${best ? "bg-[hsl(var(--primary-soft))]" : "bg-secondary/50"}`}>
                <span className="text-[14px] text-foreground">{row.r}</span>
                <span className={`text-[16px] font-semibold tracking-tight ${best ? "text-primary" : "text-foreground"}`}>
                  {row.p}<span className="text-[12px] font-normal text-muted-foreground">/mo</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-[12px] text-muted-foreground text-center">{c.referral.foot}</p>
      </div>
    </section>
  );
}

function PricingSection({ c }: { c: Copy }) {
  return (
    <section id="pricing" className="bg-secondary/40 border-y border-border/60">
      <div className="mx-auto max-w-4xl px-6 py-28">
        <div className="text-center mb-12">
          <p className="text-[12px] uppercase tracking-wider font-medium text-primary mb-4">{c.pricing.eyebrow}</p>
          <h2 className="text-[40px] md:text-[52px] font-semibold tracking-[-0.025em] leading-[1.05] text-foreground">
            {c.pricing.title}
          </h2>
          <p className="mt-5 text-[17px] text-muted-foreground max-w-lg mx-auto">{c.pricing.sub}</p>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-8 md:p-10 shadow-[0_30px_80px_-30px_rgba(15,123,108,0.18)]">
          <div className="flex items-start justify-between flex-wrap gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[hsl(var(--primary-soft))] text-primary text-[11px] font-medium">
                  <Sparkles className="w-3 h-3" /> {c.pricing.allIn}
                </div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold uppercase tracking-wide">
                  {c.pricing.firstFree}
                </div>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-[56px] font-semibold tracking-[-0.03em] leading-none text-foreground">€0</span>
                <span className="text-[14px] text-muted-foreground pb-2">{c.pricing.firstMonth}</span>
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">
                {c.pricing.thenA}<span className="text-foreground font-medium">{c.pricing.thenB}</span>{c.pricing.thenC}
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-primary/90 transition-colors self-end"
            >
              {c.pricing.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {c.pricing.features.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-[14px] text-foreground">
                <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-secondary/60 border border-border/60 p-5 grid sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{c.pricing.base}</p>
              <p className="text-[18px] font-semibold tracking-tight text-foreground mt-1">€25,99</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{c.pricing.perRef}</p>
              <p className="text-[18px] font-semibold tracking-tight text-primary mt-1">−€1,00</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{c.pricing.floor}</p>
              <p className="text-[18px] font-semibold tracking-tight text-foreground mt-1">€15,99</p>
            </div>
          </div>

          <p className="mt-6 text-center text-[12px] text-muted-foreground">{c.pricing.foot}</p>
        </div>
      </div>
    </section>
  );
}

function FinalCta({ c }: { c: Copy }) {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-32">
      <div className="rounded-[32px] bg-foreground text-background p-12 md:p-20 text-center">
        <h2 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.025em] leading-[1.05]">
          {c.finalCta.title}
        </h2>
        <p className="mt-5 text-[17px] text-background/70 max-w-md mx-auto">{c.finalCta.sub}</p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-background text-foreground px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-background/90 transition-colors"
          >
            {c.finalCta.cta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="mt-8 flex items-center justify-center gap-6 text-[13px] text-background/60 flex-wrap">
          {c.finalCta.bullets.map((x) => (
            <span key={x} className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {x}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary grid place-items-center">
            <span className="text-primary-foreground text-[11px] font-semibold">C</span>
          </div>
          <span className="text-[13px] text-muted-foreground">© {new Date().getFullYear()} Cash Maatje</span>
        </div>
        <div className="flex items-center gap-6 text-[13px] text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const { lang } = useI18n();
  const c = copy[lang];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav c={c} />
      <Hero c={c} />
      <TrustStrip c={c} />
      <BenefitsSection c={c} />
      <PricingSection c={c} />
      <ReferralSection c={c} />
      <Features c={c} />
      <AiSection c={c} />
      <Testimonials c={c} />
      <FinalCta c={c} />
      <Footer />
    </div>
  );
}
