import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: "Concept", cls: "bg-muted text-muted-foreground" },
  sent: { label: "Verzonden", cls: "bg-foreground/5 text-foreground/80" },
  paid: { label: "Betaald", cls: "bg-primary/10 text-primary" },
  partial: { label: "Deelbetaling", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  overdue: { label: "Verlopen", cls: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Geannuleerd", cls: "bg-muted text-muted-foreground line-through" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

function Pill({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", className)}>
      {label}
    </span>
  );
}

interface Props {
  invoices: Array<{
    id: string;
    invoice_number: string;
    invoice_date: string;
    contact_name: string | null;
    subtotal: number;
    total_vat: number;
    total_amount: number;
    status: string;
    due_date: string | null;
  }>;
  isLoading: boolean;
  onSelect?: (id: string) => void;
}

export function InvoicesTable({ invoices, isLoading, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
        Laden...
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
        Geen facturen gevonden
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Nummer</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Datum</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Relatie</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium text-right">Excl.</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium text-right">BTW</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium text-right">Totaal</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Vervaldatum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => {
            const s = STATUS_MAP[inv.status] ?? STATUS_MAP.draft;
            const dueDate = inv.due_date ? new Date(inv.due_date) : null;
            const today = new Date(); today.setHours(0,0,0,0);
            const daysDiff = dueDate ? Math.round((dueDate.getTime() - today.getTime()) / 86400000) : null;
            const isUnpaid = ["sent","partial","overdue"].includes(inv.status);
            const isOverdue = isUnpaid && daysDiff !== null && daysDiff < 0;

            let countdown: { label: string; cls: string } | null = null;
            if (isUnpaid && daysDiff !== null) {
              if (daysDiff < 0) countdown = { label: `${Math.abs(daysDiff)}d te laat`, cls: "bg-destructive/10 text-destructive" };
              else if (daysDiff === 0) countdown = { label: "Vandaag", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
              else if (daysDiff <= 7) countdown = { label: `${daysDiff}d`, cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
              else countdown = { label: `${daysDiff}d`, cls: "bg-muted text-muted-foreground" };
            }

            return (
              <TableRow
                key={inv.id}
                className="border-border/60 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => onSelect?.(inv.id)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">{inv.invoice_number}</TableCell>
                <TableCell className="text-sm">{format(new Date(inv.invoice_date), "d MMM yyyy", { locale: nl })}</TableCell>
                <TableCell className="text-sm font-medium">{inv.contact_name ?? "—"}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{fmt(inv.subtotal)}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{fmt(inv.total_vat)}</TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums">{fmt(inv.total_amount)}</TableCell>
                <TableCell>
                  <Pill
                    label={isOverdue ? "Verlopen" : s.label}
                    className={isOverdue ? STATUS_MAP.overdue.cls : s.cls}
                  />
                </TableCell>
                <TableCell>
                  {dueDate ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{format(dueDate, "d MMM", { locale: nl })}</span>
                      {countdown && <Pill label={countdown.label} className={countdown.cls} />}
                    </div>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
