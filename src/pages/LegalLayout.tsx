import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function LegalLayout({
  eyebrow,
  titleA,
  titleB,
  intro,
  children,
}: {
  eyebrow: string;
  titleA: string;
  titleB: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-obsidian text-bone">
      <header className="border-b border-white/5">
        <div className="mx-auto max-w-[1200px] px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-white grid place-items-center">
              <span className="text-black text-[12px] font-semibold">C</span>
            </div>
            <span className="text-[14px] tracking-stamp uppercase text-white">CASH MAATJE</span>
          </Link>
          <Link to="/" className="origin-pill-ghost inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3 h-3" strokeWidth={2.5} /> Terug
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[860px] px-6 py-24">
        <p className="text-micro text-frost mb-6">{eyebrow}</p>
        <h1 className="text-heading-lg text-bone">
          <span className="text-italic-display">{titleA}</span>{" "}
          <span className="font-display">{titleB}</span>
        </h1>
        <p className="mt-6 text-subheading text-frost max-w-2xl">{intro}</p>

        <div className="mt-16 space-y-12">{children}</div>
      </section>

      <footer className="border-t border-white/5 bg-obsidian">
        <div className="mx-auto max-w-[1200px] px-6 py-12 flex flex-wrap items-center justify-between gap-4">
          <span className="text-caption font-stamp text-frost">© {new Date().getFullYear()} CASH MAATJE</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-stamp text-frost">
            <Link to="/security" className="hover:text-bone">SECURITY</Link>
            <Link to="/compliance" className="hover:text-bone">COMPLIANCE</Link>
            <Link to="/about" className="hover:text-bone">OVER ONS</Link>
            <Link to="/pricing" className="hover:text-bone">PRIJZEN</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/5 bg-card p-8">
      <h2 className="font-display text-[24px] font-light text-bone leading-tight mb-4">{title}</h2>
      <div className="space-y-3 text-body text-frost leading-relaxed">{children}</div>
    </div>
  );
}
