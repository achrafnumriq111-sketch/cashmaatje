import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "cashmaatje.cookieConsent.v1";

type Consent = "accepted" | "essential" | null;

export function getCookieConsent(): Consent {
  if (typeof window === "undefined") return null;
  return (window.localStorage.getItem(STORAGE_KEY) as Consent) ?? null;
}

export function CookieConsent() {
  const [choice, setChoice] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setChoice(getCookieConsent());
  }, []);

  if (!mounted || choice) return null;

  const save = (v: Exclude<Consent, null>) => {
    window.localStorage.setItem(STORAGE_KEY, v);
    setChoice(v);
    window.dispatchEvent(new CustomEvent("cookieConsent", { detail: v }));
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie-toestemming"
      className="fixed inset-x-3 bottom-3 z-[100] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md"
    >
      <div className="rounded-2xl border border-white/10 bg-obsidian/95 backdrop-blur-md p-5 shadow-2xl text-bone">
        <p className="text-[13.5px] leading-relaxed text-frost">
          We gebruiken alleen functionele cookies om je ingelogd te houden. Analytische cookies plaatsen we
          pas na jouw akkoord. Zie onze{" "}
          <Link to="/privacy" className="text-bone underline hover:no-underline">privacyverklaring</Link>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => save("accepted")}
            className="flex-1 min-w-[120px] rounded-full bg-white text-black text-[13px] font-medium px-4 py-2.5 hover:bg-white/90 transition"
          >
            Alles accepteren
          </button>
          <button
            onClick={() => save("essential")}
            className="flex-1 min-w-[120px] rounded-full border border-white/15 text-bone text-[13px] font-medium px-4 py-2.5 hover:bg-white/5 transition"
          >
            Alleen noodzakelijk
          </button>
        </div>
      </div>
    </div>
  );
}
