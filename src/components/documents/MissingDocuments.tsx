import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string;
  transaction_date: string;
  description: string | null;
  counterparty_name: string | null;
  amount: number;
  status: string;
}

interface Props {
  transactions: Transaction[];
}

export function MissingDocuments({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mb-2" />
        <p className="text-sm font-medium">Geen ontbrekende documenten</p>
        <p className="text-xs mt-1">
          Alle uitgaven boven €100 hebben een gekoppeld document.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <span>
          Banktransacties boven €100 (uitgaand) zonder gekoppeld document.
          Bewaarplicht vereist dat u deze documenten bewaart.
        </span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Tegenpartij</TableHead>
              <TableHead className="text-right">Bedrag</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-sm">
                  {format(new Date(tx.transaction_date), "d MMM yyyy", {
                    locale: nl,
                  })}
                </TableCell>
                <TableCell className="text-sm max-w-[250px] truncate">
                  {tx.description ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {tx.counterparty_name ?? "—"}
                </TableCell>
                <TableCell className="text-right text-sm font-medium text-destructive">
                  €{" "}
                  {Math.abs(tx.amount).toLocaleString("nl-NL", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    Ontbreekt
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
