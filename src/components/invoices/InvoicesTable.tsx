import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Concept", className: "bg-muted text-muted-foreground" },
  sent: { label: "Verzonden", className: "bg-blue-500/20 text-blue-400" },
  paid: { label: "Betaald", className: "bg-primary/20 text-primary" },
  partial: { label: "Deelbetaling", className: "bg-yellow-500/20 text-yellow-400" },
  overdue: { label: "Verlopen", className: "bg-destructive/20 text-destructive" },
  cancelled: { label: "Geannuleerd", className: "bg-muted text-muted-foreground line-through" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

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
    return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  }

  if (invoices.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Geen facturen gevonden</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead>Nummer</TableHead>
          <TableHead>Datum</TableHead>
          <TableHead>Relatie</TableHead>
          <TableHead className="text-right">Excl. BTW</TableHead>
          <TableHead className="text-right">BTW</TableHead>
          <TableHead className="text-right">Totaal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Vervaldatum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => {
          const s = STATUS_MAP[inv.status] ?? STATUS_MAP.draft;
          const isOverdue = inv.due_date && inv.status === "sent" && new Date(inv.due_date) < new Date();

          return (
            <TableRow
              key={inv.id}
              className="border-border cursor-pointer hover:bg-secondary/50"
              onClick={() => onSelect?.(inv.id)}
            >
              <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
              <TableCell>{format(new Date(inv.invoice_date), "d MMM yyyy", { locale: nl })}</TableCell>
              <TableCell>{inv.contact_name ?? "—"}</TableCell>
              <TableCell className="text-right">{fmt(inv.subtotal)}</TableCell>
              <TableCell className="text-right">{fmt(inv.total_vat)}</TableCell>
              <TableCell className="text-right font-medium">{fmt(inv.total_amount)}</TableCell>
              <TableCell>
                <Badge className={isOverdue ? STATUS_MAP.overdue.className : s.className}>
                  {isOverdue ? "Verlopen" : s.label}
                </Badge>
              </TableCell>
              <TableCell>
                {inv.due_date
                  ? format(new Date(inv.due_date), "d MMM yyyy", { locale: nl })
                  : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
