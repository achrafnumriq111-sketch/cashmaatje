import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Star, Users } from "lucide-react";
import { useI18n, type Language } from "@/lib/i18n";
import duskSky from "@/assets/dusk-sky.jpg";
import textureSand from "@/assets/texture-sand.jpg";
import textureWater from "@/assets/texture-water.jpg";
import textureLavender from "@/assets/texture-lavender.jpg";
import textureMarble from "@/assets/texture-marble.jpg";

/* ──────────────────────────────────────────────────────────────────
   CashMaatje — Landing (Origin Financial design system)
   Serif headlines floating above dusk clouds. White pill CTAs only.
   Chromatic illuminated feature cards. Editorial finance.
   ────────────────────────────────────────────────────────────────── */

type Copy = {
  nav: { features: string; ai: string; referral: string; pricing: string; signin: string; start: string };
  hero: { badge: string; titleA: string; titleB: string; sub: string; cta: string; seeHow: string; disclaimer: string };
  trust: { line: string; reviews: string };
  benefits: { items: { eyebrow: string; title: string; desc: string }[] };
  featuresHeading: { titleA: string; titleB: string; sub: string };
  feature: { invoicing: string; expenses: string; dashboard: string; tax: string };
  ai: { eyebrow: string; titleA: string; titleB: string; sub: string };
  testimonials: { items: { q: string; n: string; r: string }[] };
  pricing: {
    eyebrow: string; titleA: string; titleB: string; sub: string; allIn: string; firstFree: string;
    firstMonth: string; thenA: string; thenB: string; thenC: string; cta: string; features: string[];
    base: string; perRef: string; floor: string; foot: string;
  };
  referral: { eyebrow: string; titleA: string; titleB: string; sub: string; steps: { t: string; d: string }[]; live: string; rows: { r: string; p: string }[]; foot: string };
  finalCta: { titleA: string; titleB: string; sub: string; cta: string; bullets: string[] };
};

const copy: Record<Language, Copy> = {
  nl: {
    nav: { features: "PRODUCTEN", ai: "AI", referral: "REFERRAL", pricing: "PRIJZEN", signin: "INLOGGEN", start: "Probeer gratis" },
    hero: {
      badge: "Eerste maand gratis · geen creditcard",
      titleA: "Jouw geld.",
      titleB: "Helder in zicht.",
      sub: "Facturen, kosten en belastingen — automatisch geregeld. Boven de wolken denken, niet in spreadsheets.",
      cta: "Begin gratis",
      seeHow: "Bekijk hoe het werkt",
      disclaimer: "Daarna vanaf €25,99/maand — zakt €1 per actieve referral, tot €15,99/maand. Altijd opzegbaar.",
    },
    trust: { line: "Vertrouwd door moderne Nederlandse ondernemers", reviews: "4.9 · 320+ reviews" },
    benefits: {
      items: [
        { eyebrow: "AUTOPILOT", title: "Volledig geautomatiseerd", desc: "Van bonnen tot aangiftes — geen handwerk meer." },
        { eyebrow: "FISCAAL", title: "Altijd belasting-klaar", desc: "Realtime belastingreserve. Nooit verrassingen." },
        { eyebrow: "HELDER", title: "Eén overzicht", desc: "Cashflow, winst en BTW in één rustig beeld." },
      ],
    },
    featuresHeading: { titleA: "Vereenvoudig", titleB: "je geld.", sub: "Vier ingebouwde modules die je administratie geruisloos draaien." },
    feature: {
      invoicing: "Facturatie",
      expenses: "Bonnen & kosten",
      dashboard: "Live dashboard",
      tax: "Belasting-reserve",
    },
    ai: { eyebrow: "AI-ASSISTENT", titleA: "Vraag het", titleB: "aan Cash Maatje.", sub: "Conversationele intelligentie boven op je hele financiële beeld." },
    testimonials: {
      items: [
        { q: "Het voelt alsof er een accountant 24/7 met me meekijkt.", n: "Sanne K.", r: "ZZP designer" },
        { q: "Eindelijk geen kwartaalstress meer. Alles klopt al voor ik kijk.", n: "Mark de V.", r: "Webshop eigenaar" },
        { q: "De rust die dit geeft is letterlijk geld waard.", n: "Lisa B.", r: "Holding directeur" },
      ],
    },
    pricing: {
      eyebrow: "PRIJZEN", titleA: "Eén plan.", titleB: "Alles erin.",
      sub: "Eerste maand gratis. Daarna €25,99 — zakt naar €15,99 met 10 actieve referrals.",
      allIn: "ALL-IN PLAN", firstFree: "1E MAAND GRATIS",
      firstMonth: "eerste maand", thenA: "Daarna ", thenB: "€25,99/maand", thenC: " — vanaf €15,99 met 10 actieve referrals.",
      cta: "Probeer 1 maand gratis",
      features: [
        "Onbeperkt facturen & bonnen",
        "Bankkoppelingen + AI-matching",
        "BTW-aangiftes (kwartaal/maand) + ICP",
        "Volledige AI boekhoud-autopilot",
        "Jaarrekening, audit dossier, VPB",
        "Stakeholder CRM + bedrijfsstructuur",
        "Automation Center & Process Flows",
        "Accountant-toegang + API",
      ],
      base: "BASIS", perRef: "PER REFERRAL", floor: "VLOER",
      foot: "Eerste maand gratis · Geen creditcard · Altijd opzegbaar · Excl. BTW",
    },
    referral: {
      eyebrow: "REFERRAL",
      titleA: "Deel het.",
      titleB: "Je prijs zakt mee.",
      sub: "Voor elke actieve referral gaat je maandprijs €1 omlaag, tot €15,99.",
      steps: [
        { t: "Deel je link", d: "Eigen referralcode in je dashboard." },
        { t: "Vriend start", d: "Eerste maand gratis voor jullie beiden." },
        { t: "Prijs daalt", d: "Automatisch verrekend bij je volgende factuur." },
      ],
      live: "LIVE",
      rows: [
        { r: "0 referrals", p: "€25,99" },
        { r: "5 referrals", p: "€20,99" },
        { r: "10 referrals", p: "€15,99" },
      ],
      foot: "Voorbeeld — verrekening per actieve referral, per maand.",
    },
    finalCta: {
      titleA: "Begin bij",
      titleB: "helderheid.",
      sub: "Eerste maand gratis. Klaar binnen 2 minuten.",
      cta: "Start gratis",
      bullets: ["1e maand gratis", "Geen creditcard", "Altijd opzegbaar"],
    },
  },
  en: {
    nav: { features: "PRODUCTS", ai: "AI", referral: "REFERRAL", pricing: "PRICING", signin: "LOG IN", start: "Get started" },
    hero: {
      badge: "First month free · no credit card",
      titleA: "Own your",
      titleB: "money.",
      sub: "Invoices, expenses and taxes — handled automatically. Think above the clouds, not in spreadsheets.",
      cta: "Start free",
      seeHow: "See how it works",
      disclaimer: "Then from €25.99/month — drops €1 per active referral, down to €15.99/month. Cancel anytime.",
    },
    trust: { line: "Trusted by modern Dutch entrepreneurs", reviews: "4.9 · 320+ reviews" },
    benefits: {
      items: [
        { eyebrow: "AUTOPILOT", title: "Fully automated", desc: "From receipts to filings — no manual work." },
        { eyebrow: "TAX READY", title: "Always tax-ready", desc: "Real-time tax reserve. No surprises." },
        { eyebrow: "CLARITY", title: "One quiet view", desc: "Cash, profit and VAT in a single calm picture." },
      ],
    },
    featuresHeading: { titleA: "Simplify", titleB: "your money.", sub: "Four built-in modules that run your books silently." },
    feature: { invoicing: "Invoicing", expenses: "Receipts & costs", dashboard: "Live dashboard", tax: "Tax reserve" },
    ai: { eyebrow: "AI ASSISTANT", titleA: "Just ask", titleB: "Cash Maatje.", sub: "Conversational intelligence on top of your full financial picture." },
    testimonials: {
      items: [
        { q: "Feels like an accountant is watching 24/7.", n: "Sanne K.", r: "Freelance designer" },
        { q: "Finally no quarterly stress. Everything matches before I check.", n: "Mark de V.", r: "Webshop owner" },
        { q: "The peace of mind is literally worth money.", n: "Lisa B.", r: "Holding director" },
      ],
    },
    pricing: {
      eyebrow: "PRICING", titleA: "One plan.", titleB: "Everything in.",
      sub: "First month free. Then €25.99 — drops to €15.99 with 10 active referrals.",
      allIn: "ALL-IN PLAN", firstFree: "1ST MONTH FREE",
      firstMonth: "first month", thenA: "Then ", thenB: "€25.99/month", thenC: " — as low as €15.99 with 10 active referrals.",
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
      base: "BASE", perRef: "PER REFERRAL", floor: "FLOOR",
      foot: "First month free · No credit card · Cancel anytime · Excl. VAT",
    },
    referral: {
      eyebrow: "REFERRAL",
      titleA: "Share it.",
      titleB: "Your price drops.",
      sub: "Every active referral lowers your monthly price by €1, down to €15.99.",
      steps: [
        { t: "Share your link", d: "Your own referral code in the dashboard." },
        { t: "Friend signs up", d: "First month free for both of you." },
        { t: "Price drops", d: "Automatically applied on your next invoice." },
      ],
      live: "LIVE",
      rows: [
        { r: "0 referrals", p: "€25.99" },
        { r: "5 referrals", p: "€20.99" },
        { r: "10 referrals", p: "€15.99" },
      ],
      foot: "Example — applied per active referral, per month.",
    },
    finalCta: {
      titleA: "Start with",
      titleB: "clarity.",
      sub: "First month free. Setup in under 2 minutes.",
      cta: "Get started",
      bullets: ["First month free", "No credit card", "Cancel anytime"],
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

function PillCTA({ to, children, dark = false }: { to: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <Link
      to={to}
      className={
        dark
          ? "origin-pill"
          : "origin-pill"
      }
    >
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
            { href: "#features", label: c.nav.features },
            { href: "#ai", label: c.nav.ai },
            { href: "#referral", label: c.nav.referral },
            { href: "#pricing", label: c.nav.pricing },
          ].map((l) => (
            <a key={l.href} href={l.href} className="px-3 py-1.5 rounded-lg text-[11px] font-stamp text-white/85 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
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
      {/* Full-bleed dusk-sky — sky stays bright on top, only fades to obsidian at the bottom */}
      <img
        src={duskSky}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1280}
        fetchPriority="high"
      />
      {/* Top: subtle nav scrim for legibility. Bottom: long fade into obsidian for the next section to bleed into. */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-obsidian/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[55vh] bg-gradient-to-b from-transparent via-obsidian/70 to-obsidian" />

      <div className="relative mx-auto max-w-[1200px] px-6 w-full pt-24 pb-40">
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

          <p className="mt-8 text-subheading text-white/85 max-w-xl mx-auto drop-shadow-[0_1px_20px_rgba(0,0,0,0.3)]">{c.hero.sub}</p>

          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <PillCTA to="/register">{c.hero.cta}</PillCTA>
            <a href="#features" className="origin-pill-ghost">{c.hero.seeHow}</a>
          </div>

          <p className="mt-8 text-caption text-white/65 max-w-md mx-auto">{c.hero.disclaimer}</p>

          {/* Floating chat input (signature interaction) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 max-w-[640px] mx-auto"
          >
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-5 py-3.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
              <span className="text-white/85 text-body flex-1 text-left">Hoe staat mijn BTW dit kwartaal?</span>
              <button className="w-9 h-9 rounded-full bg-white/30 backdrop-blur grid place-items-center hover:bg-white/45 transition">
                <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Trust Strip ─────────────────────────────────────────────────── */

function TrustStrip({ c }: { c: Copy }) {
  return (
    <section className="border-y border-white/8">
      <div className="mx-auto max-w-[1200px] px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-caption font-stamp text-frost">{c.trust.line}</p>
        <div className="flex items-center gap-8 text-body-sm text-frost">
          <span>ACME</span><span>NORTHWIND</span><span>GLOBEX</span><span>INITECH</span><span>HOOLI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="w-3 h-3 fill-bone text-bone" />)}
          </div>
          <span className="text-caption text-frost">{c.trust.reviews}</span>
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
      {sub && <p className="mt-6 text-subheading text-frost max-w-md mx-auto">{sub}</p>}
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
  const cards = [
    {
      label: c.feature.invoicing,
      img: textureSand,
      mock: (
        <div className="rounded-2xl bg-graphite/85 backdrop-blur-xl border border-white/8 p-5 shadow-feature">
          <p className="text-[9px] font-stamp text-frost mb-3">FACTUUR · 2026-0142</p>
          <p className="font-display text-[28px] font-light text-bone leading-none">€ 4.250,00</p>
          <p className="mt-1 text-caption text-frost">verstuurd · 2 dagen geleden</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] font-stamp text-bone bg-white/10 px-2 py-1 rounded-full">BETAALD</span>
            <span className="text-caption text-frost">21% BTW</span>
          </div>
        </div>
      ),
    },
    {
      label: c.feature.expenses,
      img: textureMarble,
      mock: (
        <div className="rounded-2xl bg-graphite/85 backdrop-blur-xl border border-white/8 p-5 shadow-feature">
          <p className="text-[9px] font-stamp text-frost mb-3">BONNEN DEZE MAAND</p>
          <p className="font-display text-[28px] font-light text-bone leading-none">186</p>
          <p className="mt-1 text-caption text-frost">automatisch geboekt</p>
          <div className="mt-4 h-1 bg-white/8 rounded-full overflow-hidden">
            <div className="h-full w-[82%] bg-bone rounded-full" />
          </div>
          <p className="mt-2 text-caption text-frost">82% AI-zekerheid</p>
        </div>
      ),
    },
    {
      label: c.feature.dashboard,
      img: textureWater,
      mock: (
        <div className="rounded-2xl bg-graphite/85 backdrop-blur-xl border border-white/8 p-5 shadow-feature">
          <p className="text-[9px] font-stamp text-frost mb-3">CASHFLOW · NOV</p>
          <p className="font-display text-[28px] font-light text-bone leading-none">+€ 12.840</p>
          <svg viewBox="0 0 120 32" className="mt-3 w-full h-8" fill="none">
            <path d="M0 24 L20 18 L40 22 L60 12 L80 16 L100 6 L120 10" stroke="#9f9fa0" strokeWidth="1.5" />
            <circle cx="120" cy="10" r="2.5" fill="#f5f5f7" />
          </svg>
          <p className="mt-2 text-caption text-frost">+24% vs vorige maand</p>
        </div>
      ),
    },
    {
      label: c.feature.tax,
      img: textureLavender,
      mock: (
        <div className="rounded-2xl bg-graphite/85 backdrop-blur-xl border border-white/8 p-5 shadow-feature">
          <p className="text-[9px] font-stamp text-frost mb-3">BTW-RESERVE · Q4</p>
          <p className="font-display text-[28px] font-light text-bone leading-none">€ 5.420</p>
          <p className="mt-1 text-caption text-frost">gereserveerd · dekking 100%</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-bone animate-pulse" />
            <span className="text-caption text-frost">aangifte 31 jan</span>
          </div>
        </div>
      ),
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-[1200px] px-6 py-32">
      <SectionHeading titleA={c.featuresHeading.titleA} titleB={c.featuresHeading.titleB} sub={c.featuresHeading.sub} />
      <div className="grid md:grid-cols-2 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[30px] min-h-[420px] flex flex-col justify-end p-8 group"
          >
            <img
              src={card.img}
              alt=""
              loading="lazy"
              width={1024}
              height={1280}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
            <p className="absolute top-7 left-8 text-[10px] font-stamp text-white/90">{card.label.toUpperCase()}</p>
            <div className="relative max-w-[300px]">{card.mock}</div>
          </motion.div>
        ))}
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
              Hoeveel BTW moet ik nog reserveren dit kwartaal?
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amethyst grid place-items-center shrink-0">
              <span className="text-white text-[12px] font-stamp">AI</span>
            </div>
            <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-md text-body-sm text-bone max-w-[80%] leading-relaxed">
              Je hebt nog € 1.240 nodig om volledig gedekt te zijn. Ik heb dit al gereserveerd op je tax-account.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Testimonials ────────────────────────────────────────────────── */

function Testimonials({ c }: { c: Copy }) {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-32">
      <div className="grid md:grid-cols-3 gap-6">
        {c.testimonials.items.map((t) => (
          <motion.div
            key={t.n}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="rounded-[30px] bg-card border border-white/5 p-8 cm-hover-lift"
          >
            <div className="flex mb-4">
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="w-3 h-3 fill-bone text-bone" />)}
            </div>
            <p className="font-display text-[20px] font-light text-bone leading-snug">"{t.q}"</p>
            <div className="mt-6">
              <p className="text-body-sm font-medium text-bone">{t.n}</p>
              <p className="text-caption text-frost">{t.r}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── Pricing ─────────────────────────────────────────────────────── */

function PricingSection({ c }: { c: Copy }) {
  return (
    <section id="pricing" className="bg-carbon border-y border-white/5">
      <div className="mx-auto max-w-3xl px-6 py-32">
        <SectionHeading eyebrow={c.pricing.eyebrow} titleA={c.pricing.titleA} titleB={c.pricing.titleB} sub={c.pricing.sub} />

        <div className="rounded-[30px] bg-card border border-white/5 p-10 shadow-feature">
          <div className="flex items-start justify-between flex-wrap gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span className="px-2.5 py-1 rounded-full border border-white/15 text-[10px] font-stamp text-bone">{c.pricing.allIn}</span>
                <span className="px-2.5 py-1 rounded-full bg-white text-carbon text-[10px] font-stamp">{c.pricing.firstFree}</span>
              </div>
              <div className="flex items-end gap-3">
                <span className="font-display text-[80px] font-light leading-none text-bone">€0</span>
                <span className="text-body-sm text-frost pb-3">{c.pricing.firstMonth}</span>
              </div>
              <p className="mt-4 text-body-sm text-frost">
                {c.pricing.thenA}<span className="text-bone">{c.pricing.thenB}</span>{c.pricing.thenC}
              </p>
            </div>
            <PillCTA to="/register">{c.pricing.cta}</PillCTA>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {c.pricing.features.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-body-sm text-bone">
                <Check className="w-4 h-4 mt-0.5 text-bone shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-popover border border-white/5 p-5 grid sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-micro text-frost">{c.pricing.base}</p>
              <p className="font-display text-[24px] font-light text-bone mt-2">€25,99</p>
            </div>
            <div>
              <p className="text-micro text-frost">{c.pricing.perRef}</p>
              <p className="font-display text-[24px] font-light text-bone mt-2">−€1,00</p>
            </div>
            <div>
              <p className="text-micro text-frost">{c.pricing.floor}</p>
              <p className="font-display text-[24px] font-light text-bone mt-2">€15,99</p>
            </div>
          </div>

          <p className="mt-8 text-center text-caption text-frost">{c.pricing.foot}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Referral ────────────────────────────────────────────────────── */

function ReferralSection({ c }: { c: Copy }) {
  return (
    <section id="referral" className="mx-auto max-w-[1200px] px-6 py-32">
      <SectionHeading eyebrow={c.referral.eyebrow} titleA={c.referral.titleA} titleB={c.referral.titleB} sub={c.referral.sub} />
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {c.referral.steps.map((s, i) => (
          <div key={s.t} className="rounded-[30px] border border-white/5 bg-card p-8">
            <p className="font-mono text-caption text-frost mb-5">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="font-display text-[24px] font-light text-bone">{s.t}</h3>
            <p className="mt-3 text-body-sm text-frost">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[30px] border border-white/5 bg-card p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-body-sm text-frost">
            <Users className="w-4 h-4" /> Jouw prijs
          </div>
          <span className="px-2 py-0.5 rounded-full border border-white/15 text-[10px] font-stamp text-bone">{c.referral.live}</span>
        </div>
        <div className="space-y-2">
          {c.referral.rows.map((row, i) => {
            const best = i === c.referral.rows.length - 1;
            return (
              <div key={row.r} className={`flex items-center justify-between py-4 px-5 rounded-2xl ${best ? "bg-amethyst/15 border border-amethyst/30" : "bg-popover"}`}>
                <span className="text-body-sm text-bone">{row.r}</span>
                <span className={`font-display text-[24px] font-light ${best ? "text-amethyst" : "text-bone"}`}>{row.p}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-caption text-frost text-center">{c.referral.foot}</p>
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

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-obsidian">
      <div className="mx-auto max-w-[1200px] px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-white grid place-items-center">
            <span className="text-black text-[10px] font-semibold">C</span>
          </div>
          <span className="text-caption font-stamp text-frost">© {new Date().getFullYear()} CASH MAATJE</span>
        </div>
        <div className="flex items-center gap-6 text-[11px] font-stamp text-frost">
          <Link to="/pricing" className="hover:text-bone">PRICING</Link>
          <a href="#" className="hover:text-bone">PRIVACY</a>
          <a href="#" className="hover:text-bone">TERMS</a>
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
      <TrustStrip c={c} />
      <BenefitsSection c={c} />
      <Features c={c} />
      <AiSection c={c} />
      <Testimonials c={c} />
      <PricingSection c={c} />
      <ReferralSection c={c} />
      <FinalCta c={c} />
      <Footer />
    </div>
  );
}
