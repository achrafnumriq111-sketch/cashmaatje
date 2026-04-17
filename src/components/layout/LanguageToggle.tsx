import { Globe } from "lucide-react";
import { useI18n, type Language } from "@/lib/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();

  const toggle = () => setLang((lang === "nl" ? "en" : "nl") as Language);

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            aria-label={t("header.language")}
          >
            <Globe className="w-[18px] h-[18px]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {t("header.language")}: {lang.toUpperCase()}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-secondary border border-border">
      {(["nl", "en"] as Language[]).map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide transition ${
            lang === code
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
