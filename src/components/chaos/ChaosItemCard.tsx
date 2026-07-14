import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Phone,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { ChaosItem, ChaosPriority } from "@/hooks/useChaosData";
import { CallModePanel } from "./CallModePanel";
import { OneClickTemplates } from "./OneClickTemplates";
import { ProofVault } from "./ProofVault";
import { RiskTimelineStrip } from "./RiskTimelineStrip";
import { MissingDocsPanel } from "./MissingDocsPanel";
import { ConfidenceChip } from "./ConfidenceChip";

const priorityStyle: Record<
  ChaosPriority,
  { dot: string; label: string; ring: string; chip: string }
> = {
  red: {
    dot: "bg-red-500",
    label: "URGENT",
    ring: "ring-red-500/30",
    chip: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  orange: {
    dot: "bg-amber-500",
    label: "BELANGRIJK",
    ring: "ring-amber-500/30",
    chip: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  green: {
    dot: "bg-emerald-500",
    label: "INFORMATIEF",
    ring: "ring-emerald-500/30",
    chip: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
};

const categoryLabel: Record<string, string> = {
  belastingdienst: "Belastingdienst",
  deurwaarder: "Deurwaarder",
  leverancier: "Leverancier",
  uwv: "UWV",
  gemeente: "Gemeente",
  bank: "Bank",
  kvk: "KvK",
  overig: "Overig",
};

interface Props {
  item: ChaosItem;
  onResolve: (id: string) => void;
  onReopen?: (id: string) => void;
  onDelete?: () => void;
}

export function ChaosItemCard({ item, onResolve, onReopen, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const p = priorityStyle[item.priority];
  const deadline = item.payment_deadline || item.legal_deadline;
  const daysLeft = deadline
    ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onClick={() => setOpen(true)}
        className={`w-full text-left rounded-2xl border bg-card p-5 transition-all hover:shadow-md ${
          item.is_resolved ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`mt-1 w-2 h-2 rounded-full ${p.dot} ring-4 ${p.ring}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className={`text-[10px] font-semibold tracking-wide ${p.chip}`}>
                  {p.label}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {categoryLabel[item.category] ?? item.category}
                </span>
                {item.sender_name && (
                  <span className="text-[11px] text-muted-foreground truncate">
                    · {item.sender_name}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-foreground truncate">
                {item.document_title}
                {(item.page_count ?? 1) > 1 && (
                  <span className="ml-2 inline-flex items-center gap-1 align-middle text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    <FileText className="w-3 h-3" /> {item.page_count} pagina's
                    {item.grouping_reason === "ai_dedupe" && " · samengevoegd"}
                  </span>
                )}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {item.recommended_action}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
                {item.amount_due != null && (
                  <span className="font-medium text-foreground">
                    €{Number(item.amount_due).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                  </span>
                )}
                {deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {daysLeft !== null && daysLeft <= 7
                      ? `nog ${daysLeft} ${daysLeft === 1 ? "dag" : "dagen"}`
                      : new Date(deadline).toLocaleDateString("nl-NL")}
                  </span>
                )}
                {item.phone_number && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {item.phone_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </motion.button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`text-[10px] font-semibold tracking-wide ${p.chip}`}>
                {p.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {categoryLabel[item.category] ?? item.category}
                {item.sender_name && ` · ${item.sender_name}`}
              </span>
            </div>
            <SheetTitle className="text-xl">{item.document_title}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {item.summary && (
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Wat is dit
                </h4>
                <p className="text-sm text-foreground leading-relaxed">{item.summary}</p>
              </section>
            )}

            <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Wat je nu moet doen
              </h4>
              <p className="text-[15px] font-medium text-foreground leading-snug">
                {item.recommended_action}
              </p>
              {(item.payment_deadline || item.legal_deadline) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Deadline:{" "}
                  <span className="text-foreground font-medium">
                    {new Date(
                      (item.payment_deadline || item.legal_deadline) as string
                    ).toLocaleDateString("nl-NL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </section>

            {item.amount_due != null && (
              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-card p-3">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    Bedrag
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    €{Number(item.amount_due).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                {item.reference_number && (
                  <div className="rounded-lg border bg-card p-3">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      Kenmerk
                    </div>
                    <div className="mt-1 text-sm font-mono">{item.reference_number}</div>
                  </div>
                )}
              </section>
            )}

            {item.phone_number && (
              <section className="rounded-xl border bg-card p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Bel deze
                </h4>
                <a
                  href={`tel:${item.phone_number.replace(/\s/g, "")}`}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {item.phone_number}
                </a>
                {item.phone_script && (
                  <div className="mt-3">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">
                      Wat je zegt
                    </div>
                    <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
                      "{item.phone_script}"
                    </blockquote>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(item.phone_script!);
                        toast({ title: "Script gekopieerd" });
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1.5" /> Kopieer script
                    </Button>
                  </div>
                )}
              </section>
            )}

            {item.required_documents && item.required_documents.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Wat je nodig hebt
                </h4>
                <ul className="space-y-1.5">
                  {item.required_documents.map((doc, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2">
                      <span className="text-muted-foreground">•</span> {doc}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {item.risk_if_ignored && (
              <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Als je dit negeert
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {item.risk_if_ignored}
                </p>
              </section>
            )}

            <Tabs defaultValue="call" className="pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="call" className="flex-1 text-xs">Bel-modus</TabsTrigger>
                <TabsTrigger value="templates" className="flex-1 text-xs">Templates</TabsTrigger>
                <TabsTrigger value="proof" className="flex-1 text-xs">Bewijs</TabsTrigger>
                <TabsTrigger value="risk" className="flex-1 text-xs">Risico</TabsTrigger>
                <TabsTrigger value="missing" className="flex-1 text-xs">Ontbrekend</TabsTrigger>
              </TabsList>
              <TabsContent value="call" className="mt-4"><CallModePanel item={item} /></TabsContent>
              <TabsContent value="templates" className="mt-4"><OneClickTemplates item={item} /></TabsContent>
              <TabsContent value="proof" className="mt-4"><ProofVault item={item} /></TabsContent>
              <TabsContent value="risk" className="mt-4"><RiskTimelineStrip steps={item.risk_timeline} /></TabsContent>
              <TabsContent value="missing" className="mt-4"><MissingDocsPanel docs={item.missing_documents} /></TabsContent>
            </Tabs>

            <div className="flex items-center justify-between pt-2 border-t">
              <ConfidenceChip band={item.confidence_band} confidence={item.ai_confidence} />
              <div className="flex gap-2">
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={onDelete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                {item.is_resolved ? (
                  <Button variant="outline" size="sm" onClick={() => onReopen?.(item.id)}>
                    Heropen
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => { onResolve(item.id); setOpen(false); }}>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Afgehandeld
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ChaosItemSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-muted" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
      <div className="h-5 w-2/3 bg-muted rounded mb-2" />
      <div className="h-4 w-full bg-muted rounded" />
    </div>
  );
}

export function AnalyzingPlaceholder({ count }: { count: number }) {
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 flex items-center gap-3">
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
      <div className="text-sm">
        <div className="font-medium text-foreground">
          AI analyseert {count} document{count === 1 ? "" : "en"}…
        </div>
        <div className="text-xs text-muted-foreground">
          Meestal binnen 30 seconden klaar
        </div>
      </div>
    </div>
  );
}
