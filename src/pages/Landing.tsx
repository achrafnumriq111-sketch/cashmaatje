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
  Gift,
  Users,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Cash Maatje — Landing
   Calm. Sharp. Controlled.
   ────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link to="/landing" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary grid place-items-center">
            <span className="text-primary-foreground text-[13px] font-semibold">C</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Cash Maatje</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[14px] text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#ai" className="hover:text-foreground transition-colors">AI</a>
          <a href="#referral" className="hover:text-foreground transition-colors">Referral</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-[14px] text-muted-foreground hover:text-foreground px-3 py-2">
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-[14px] font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
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
            Now with AI tax assistant
          </div>
          <h1 className="text-[44px] md:text-[64px] font-semibold tracking-[-0.03em] leading-[1.02] text-foreground">
            Your money.<br />
            <span className="text-primary">Clear. Controlled.</span>
          </h1>
          <p className="mt-6 text-[18px] text-muted-foreground max-w-md leading-relaxed">
            Invoices, expenses and taxes — handled automatically.
          </p>
          <div className="mt-8 flex items-baseline gap-3">
            <span className="text-[44px] font-semibold tracking-[-0.03em] leading-none text-foreground">
              €15,99<sup className="text-primary text-[20px] font-medium ml-0.5">*</sup>
            </span>
            <span className="text-[14px] text-muted-foreground">/month</span>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-primary/90 transition-colors"
            >
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-foreground px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-secondary transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="mt-6 text-[12px] text-muted-foreground/80 max-w-md leading-relaxed">
            <span className="text-primary">*</span> Starting at €25,99/month. Drops by €1 per active referral, down to €15,99/month after 10 referrals. 14-day free trial · no credit card.
          </p>
        </motion.div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
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
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">November</p>
            <p className="text-[22px] font-semibold tracking-tight text-foreground mt-0.5">€ 28,540</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Tax reserved</p>
            <p className="text-[22px] font-semibold tracking-tight text-primary mt-0.5">€ 5,420</p>
          </div>
        </div>

        {/* Mini chart */}
        <svg viewBox="0 0 320 80" className="w-full h-20">
          <defs>
            <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 C40,55 60,40 90,38 C130,35 150,55 180,48 C210,42 240,18 280,22 L320,15 L320,80 L0,80 Z"
            fill="url(#g)"
          />
          <path
            d="M0,60 C40,55 60,40 90,38 C130,35 150,55 180,48 C210,42 240,18 280,22 L320,15"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>

        <div className="mt-5 space-y-2.5">
          {[
            { label: "Acme Studio", amount: "€ 2,400", paid: true },
            { label: "Northwind Co.", amount: "€ 1,180", paid: true },
            { label: "Globex", amount: "€ 980", paid: false },
          ].map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-[11px] font-medium text-foreground">
                  {r.label[0]}
                </div>
                <span className="text-[14px] text-foreground">{r.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-foreground">{r.amount}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    r.paid
                      ? "bg-[hsl(var(--primary-soft))] text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {r.paid ? "Paid" : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating tax pill */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl shadow-[0_20px_40px_-20px_rgba(17,17,17,0.15)] px-4 py-3 flex items-center gap-3"
      >
        <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary-soft))] grid place-items-center">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">VAT this quarter</p>
          <p className="text-[13px] font-semibold text-foreground">Filed automatically</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[13px] text-muted-foreground">Trusted by modern entrepreneurs</p>
        <div className="flex items-center gap-8 text-[13px] text-muted-foreground/80 font-medium">
          <span>Acme</span>
          <span>Northwind</span>
          <span>Globex</span>
          <span>Initech</span>
          <span>Hooli</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-foreground text-foreground" />
            ))}
          </div>
          <span className="text-[13px] text-muted-foreground">4.9 · 320+ reviews</span>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    { icon: Zap, title: "Everything automated", desc: "From receipts to filings — no manual work." },
    { icon: ShieldCheck, title: "Always tax ready", desc: "Real-time tax reserve. No surprises." },
    { icon: LineChart, title: "Real-time clarity", desc: "Know your numbers, every day." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid md:grid-cols-3 gap-10">
        {items.map((b) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--primary-soft))] grid place-items-center mb-5">
              <b.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight text-foreground">{b.title}</h3>
            <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{b.desc}</p>
          </motion.div>
        ))}
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
        <h2 className="text-[36px] md:text-[44px] font-semibold tracking-[-0.02em] leading-[1.05] text-foreground">
          {title}
        </h2>
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

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 space-y-32">
      <FeatureRow
        eyebrow="Invoicing"
        title="Send invoices in seconds."
        desc="Beautiful, branded, and paid faster. Reminders go out automatically."
      >
        <div className="space-y-3">
          {[
            { c: "Acme Studio", a: "€ 2,400.00", s: "Paid" },
            { c: "Northwind Co.", a: "€ 1,180.00", s: "Paid" },
            { c: "Globex", a: "€ 980.00", s: "Pending" },
            { c: "Initech", a: "€ 3,200.00", s: "Sent" },
          ].map((r) => (
            <div key={r.c} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-secondary/60">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-[14px] text-foreground">{r.c}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[13px] text-foreground font-medium">{r.a}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  r.s === "Paid" ? "bg-[hsl(var(--primary-soft))] text-primary" : "bg-secondary text-muted-foreground"
                }`}>{r.s}</span>
              </div>
            </div>
          ))}
        </div>
      </FeatureRow>

      <FeatureRow
        eyebrow="Expenses"
        title="Receipts in. Categorized out."
        desc="Snap a photo or forward an email. AI files it in the right place."
        reverse
      >
        <div className="space-y-2.5">
          {[
            { n: "Uber", c: "Travel", a: "€ 24.50" },
            { n: "Notion", c: "Software", a: "€ 12.00" },
            { n: "Espresso Bar", c: "Meals", a: "€ 8.40" },
            { n: "AWS", c: "Hosting", a: "€ 142.00" },
          ].map((e) => (
            <div key={e.n} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/60">
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4 text-muted-foreground" />
                <span className="text-[14px] text-foreground">{e.n}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary-soft))] text-primary font-medium">
                  {e.c}
                </span>
              </div>
              <span className="text-[13px] font-medium text-foreground">{e.a}</span>
            </div>
          ))}
        </div>
      </FeatureRow>

      <FeatureRow
        eyebrow="Dashboard"
        title="Your business, at a glance."
        desc="Revenue, profit, runway. One screen. Always up to date."
      >
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { l: "Revenue", v: "€ 28.5k" },
            { l: "Profit", v: "€ 11.2k" },
            { l: "Reserved", v: "€ 5.4k" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{s.l}</p>
              <p className="text-[18px] font-semibold tracking-tight text-foreground mt-1">{s.v}</p>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 320 80" className="w-full h-20">
          <path
            d="M0,55 C40,50 70,30 110,32 C150,35 180,55 220,42 C260,30 290,18 320,20"
            fill="none" stroke="hsl(var(--primary))" strokeWidth="1.75" strokeLinecap="round"
          />
        </svg>
      </FeatureRow>

      <FeatureRow
        eyebrow="Tax overview"
        title="Always know what's yours."
        desc="See what you owe, what's reserved, and what's safe to spend."
        reverse
      >
        <div className="space-y-3">
          {[
            { l: "You owe", v: "€ 4,820", tone: "neutral" },
            { l: "Reserved", v: "€ 5,420", tone: "primary" },
            { l: "Safe to spend", v: "€ 18,300", tone: "primary" },
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

function AiSection() {
  return (
    <section id="ai" className="bg-secondary/40 border-y border-border/60">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <p className="text-[12px] uppercase tracking-wider font-medium text-primary mb-4">AI Assistant</p>
        <h2 className="text-[40px] md:text-[52px] font-semibold tracking-[-0.025em] leading-[1.05] text-foreground">
          Just ask.
        </h2>
        <p className="mt-5 text-[17px] text-muted-foreground max-w-lg mx-auto">
          Your numbers, in plain language. Anytime.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 max-w-xl mx-auto bg-card rounded-3xl border border-border shadow-[0_20px_60px_-30px_rgba(17,17,17,0.15)] p-6 text-left"
        >
          <div className="flex justify-end mb-4">
            <div className="bg-foreground text-background px-4 py-2.5 rounded-2xl rounded-br-md text-[14px] max-w-[80%]">
              How much tax do I owe?
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-primary grid place-items-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md text-[14px] text-foreground max-w-[80%] leading-relaxed">
              You owe <span className="font-semibold text-primary">€ 4,820</span> in VAT this quarter. It's already
              reserved — due Jan 31.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { q: "Bookkeeping disappeared from my to-do list. Finally.", n: "Sara V.", r: "Founder, Studio Nord" },
    { q: "I see exactly what I can spend. No more anxiety.", n: "Mark D.", r: "Freelance developer" },
    { q: "Tax filings used to take a weekend. Now: zero.", n: "Lena K.", r: "Owner, Atelier" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((t) => (
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

function ReferralSection() {
  const steps = [
    { n: "01", t: "Share your link", d: "Each account gets a unique referral link." },
    { n: "02", t: "Friend subscribes", d: "They sign up and start their plan." },
    { n: "03", t: "You both save", d: "€1 off your monthly price for every active referral." },
  ];
  return (
    <section id="referral" className="mx-auto max-w-6xl px-6 py-28">
      <div className="text-center mb-16">
        <p className="text-[12px] uppercase tracking-wider font-medium text-primary mb-4">Referrals</p>
        <h2 className="text-[40px] md:text-[52px] font-semibold tracking-[-0.025em] leading-[1.05] text-foreground">
          Bring a friend.<br/>
          <span className="text-primary">Pay less every month.</span>
        </h2>
        <p className="mt-5 text-[17px] text-muted-foreground max-w-xl mx-auto">
          Just like TrainMore — every active referral lowers your monthly bill by €1, down to €15.99/month.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {steps.map((s) => (
          <div key={s.n} className="rounded-3xl border border-border bg-card p-7">
            <p className="text-[12px] font-mono text-primary mb-4">{s.n}</p>
            <h3 className="text-[18px] font-semibold tracking-tight text-foreground">{s.t}</h3>
            <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-border bg-card p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Users className="w-4 h-4" /> Your monthly price
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary-soft))] text-primary font-medium">
            Live example
          </span>
        </div>
        <div className="space-y-2">
          {[
            { r: "0 referrals", p: "€ 25,99" },
            { r: "3 referrals", p: "€ 22,99" },
            { r: "7 referrals", p: "€ 18,99" },
            { r: "10+ referrals", p: "€ 15,99", best: true },
          ].map((row) => (
            <div key={row.r} className={`flex items-center justify-between py-3 px-4 rounded-2xl ${row.best ? "bg-[hsl(var(--primary-soft))]" : "bg-secondary/50"}`}>
              <span className="text-[14px] text-foreground">{row.r}</span>
              <span className={`text-[16px] font-semibold tracking-tight ${row.best ? "text-primary" : "text-foreground"}`}>
                {row.p}<span className="text-[12px] font-normal text-muted-foreground">/mo</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[12px] text-muted-foreground text-center">
          Referral counts after their first successful payment. Discount auto-applied to your next invoice.
        </p>
      </div>
    </section>
  );
}

function PricingSection() {
  const features = [
    "Unlimited invoices & expenses",
    "Bank connections + AI matching",
    "VAT returns (quarterly/monthly) + ICP",
    "Full AI bookkeeping autopilot",
    "Annual report, audit dossier, CIT",
    "Stakeholder CRM + Corporate Structure",
    "Automation Center & Process Flows",
    "Accountant access + API",
  ];
  return (
    <section id="pricing" className="bg-secondary/40 border-y border-border/60">
      <div className="mx-auto max-w-4xl px-6 py-28">
        <div className="text-center mb-12">
          <p className="text-[12px] uppercase tracking-wider font-medium text-primary mb-4">Pricing</p>
          <h2 className="text-[40px] md:text-[52px] font-semibold tracking-[-0.025em] leading-[1.05] text-foreground">
            One plan. Everything in.
          </h2>
          <p className="mt-5 text-[17px] text-muted-foreground max-w-lg mx-auto">
            €25.99/month — drops to €15.99 with active referrals. Extra entities are €15.99/month each.
          </p>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-8 md:p-10 shadow-[0_30px_80px_-30px_rgba(15,123,108,0.18)]">
          <div className="flex items-start justify-between flex-wrap gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[hsl(var(--primary-soft))] text-primary text-[11px] font-medium mb-4">
                <Sparkles className="w-3 h-3" /> All-in plan
              </div>
              <div className="flex items-end gap-3">
                <span className="text-[56px] font-semibold tracking-[-0.03em] leading-none text-foreground">€25,99</span>
                <span className="text-[14px] text-muted-foreground pb-2">/month</span>
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">
                As low as <span className="text-primary font-medium">€15,99</span> with 10 active referrals.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-primary/90 transition-colors self-end"
            >
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-[14px] text-foreground">
                <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-secondary/60 border border-border/60 p-5 grid sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Base</p>
              <p className="text-[18px] font-semibold tracking-tight text-foreground mt-1">€25,99</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Per referral</p>
              <p className="text-[18px] font-semibold tracking-tight text-primary mt-1">−€1,00</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Floor</p>
              <p className="text-[18px] font-semibold tracking-tight text-foreground mt-1">€15,99</p>
            </div>
          </div>

          <p className="mt-6 text-center text-[12px] text-muted-foreground">
            14-day free trial · No credit card · Cancel anytime · Excl. VAT
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-32">
      <div className="rounded-[32px] bg-foreground text-background p-12 md:p-20 text-center">
        <h2 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.025em] leading-[1.05]">
          Start your business with clarity.
        </h2>
        <p className="mt-5 text-[17px] text-background/70 max-w-md mx-auto">
          Free for 14 days. Setup in under 2 minutes.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-background text-foreground px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-background/90 transition-colors"
          >
            Start free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="mt-8 flex items-center justify-center gap-6 text-[13px] text-background/60">
          {["No credit card", "Cancel anytime", "Dutch tax ready"].map((x) => (
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <TrustStrip />
      <Benefits />
      <Features />
      <AiSection />
      <ReferralSection />
      <PricingSection />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  );
}
