import type { ConfidenceBand } from "@/hooks/useChaosData";

interface Props {
  band: ConfidenceBand | null | undefined;
  confidence: number | null | undefined;
}

const meta: Record<ConfidenceBand, { label: string; cls: string }> = {
  high: { label: "Hoge zekerheid", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  medium: { label: "Redelijke zekerheid", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  low: { label: "Lage zekerheid", cls: "text-red-500 bg-red-500/10 border-red-500/20" },
};

export function ConfidenceChip({ band, confidence }: Props) {
  const b = band ?? "medium";
  const m = meta[b];
  const pct = confidence != null ? `${Math.round(confidence * 100)}%` : null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${m.cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {m.label}
      {pct && <span className="opacity-70 tabular-nums">· {pct}</span>}
    </span>
  );
}
