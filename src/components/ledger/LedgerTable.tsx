import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LedgerAccount } from "@/hooks/useGeneralLedger";

const typeLabels: Record<string, string> = {
  asset: "Activa",
  liability: "Passiva",
  equity: "Eigen vermogen",
  revenue: "Omzet",
  expense: "Kosten",
};

const typeColors: Record<string, string> = {
  asset: "bg-blue-500/15 text-blue-400 border-0",
  liability: "bg-amber-500/15 text-amber-400 border-0",
  equity: "bg-purple-500/15 text-purple-400 border-0",
  revenue: "bg-emerald-500/15 text-emerald-400 border-0",
  expense: "bg-red-500/15 text-red-400 border-0",
};

const fmt = (n: number) =>
  n === 0 ? "—" : new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

interface Props {
  accounts: LedgerAccount[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
}

export function LedgerTable({ accounts, isLoading, onRowClick }: Props) {
  const totalDebit = accounts.reduce((s, a) => s + a.debitTotal, 0);
  const totalCredit = accounts.reduce((s, a) => s + a.creditTotal, 0);

  if (isLoading) return <p className="text-sm text-muted-foreground py-8 text-center">Laden...</p>;
  if (!accounts.length) return <p className="text-sm text-muted-foreground py-8 text-center">Geen rekeningen gevonden</p>;

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Code</TableHead>
            <TableHead>Rekening</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[70px] text-center">BTW</TableHead>
            <TableHead className="w-[60px] text-center">Posten</TableHead>
            <TableHead className="text-right w-[120px]">Debet</TableHead>
            <TableHead className="text-right w-[120px]">Credit</TableHead>
            <TableHead className="text-right w-[120px]">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((a) => (
            <TableRow key={a.id} className="cursor-pointer" onClick={() => onRowClick(a.id)}>
              <TableCell className="font-mono text-xs text-muted-foreground">{a.code}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{a.nameNl ?? a.name}</span>
                  {a.isSystem && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">systeem</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`text-[10px] ${typeColors[a.accountType] ?? ""}`}>
                  {typeLabels[a.accountType] ?? a.accountType}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {a.vatBoxMapping ? (
                  <span className="font-mono text-xs text-primary">{a.vatBoxMapping}</span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                {a.entryCount || "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">{fmt(a.debitTotal)}</TableCell>
              <TableCell className="text-right tabular-nums text-sm">{fmt(a.creditTotal)}</TableCell>
              <TableCell className={`text-right tabular-nums text-sm font-medium ${a.balance > 0 ? "" : a.balance < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {fmt(a.balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell />
            <TableCell>Totaal ({accounts.length} rekeningen)</TableCell>
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell className="text-right tabular-nums">{fmt(totalDebit)}</TableCell>
            <TableCell className="text-right tabular-nums">{fmt(totalCredit)}</TableCell>
            <TableCell className="text-right tabular-nums">{fmt(totalDebit - totalCredit)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
