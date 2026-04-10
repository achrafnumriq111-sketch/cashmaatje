import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAccountLedger, type LedgerAccount } from "@/hooks/useGeneralLedger";

const fmt = (n: number) =>
  n === 0 ? "—" : new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

interface Props {
  account: LedgerAccount | null;
  open: boolean;
  onClose: () => void;
  dateFrom: string;
  dateTo: string;
}

export function AccountDetail({ account, open, onClose, dateFrom, dateTo }: Props) {
  const { data: lines = [], isLoading } = useAccountLedger(account?.id ?? null, dateFrom, dateTo);

  if (!account) return null;

  let runningBalance = 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">{account.code}</span>
            {account.nameNl ?? account.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Debet</p>
            <p className="text-lg font-semibold tabular-nums">{fmt(account.debitTotal)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Credit</p>
            <p className="text-lg font-semibold tabular-nums">{fmt(account.creditTotal)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-semibold tabular-nums ${account.balance < 0 ? "text-destructive" : ""}`}>
              {fmt(account.balance)}
            </p>
          </div>
        </div>

        {account.vatBoxMapping && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">BTW box: {account.vatBoxMapping}</Badge>
            {account.defaultVatPercentage != null && (
              <Badge variant="secondary" className="text-xs">{account.defaultVatPercentage}%</Badge>
            )}
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Mutaties ({lines.length})</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen mutaties in deze periode</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Datum</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead className="text-right w-[90px]">Debet</TableHead>
                    <TableHead className="text-right w-[90px]">Credit</TableHead>
                    <TableHead className="text-right w-[100px]">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l: any) => {
                    const debit = Number(l.debit_amount ?? 0);
                    const credit = Number(l.credit_amount ?? 0);
                    runningBalance += debit - credit;
                    const entry = l.journal_entries;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-muted-foreground">{entry?.date}</TableCell>
                        <TableCell className="text-sm">
                          <span>{l.description ?? entry?.description ?? "—"}</span>
                          {entry?.source_type && (
                            <Badge variant="outline" className="ml-2 text-[9px] px-1">{entry.source_type}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{fmt(debit)}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{fmt(credit)}</TableCell>
                        <TableCell className={`text-right tabular-nums text-sm font-medium ${runningBalance < 0 ? "text-destructive" : ""}`}>
                          {fmt(runningBalance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
