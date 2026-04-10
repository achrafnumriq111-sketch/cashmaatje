import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, AlertTriangle, AlertCircle, Building2, User } from "lucide-react";

const EU_COUNTRIES = ["NL","BE","DE","FR","IT","ES","AT","IE","LU","PT","GR","FI","SE","DK","PL","CZ","SK","HU","RO","BG","HR","SI","EE","LV","LT","CY","MT"];

function riskStatus(c: any) {
  const isEu = EU_COUNTRIES.includes(c.address_country ?? "NL");
  const isDomestic = (c.address_country ?? "NL") === "NL";

  // Risk: foreign EU supplier without VAT number
  if (isEu && !isDomestic && c.is_supplier && !c.btw_number) {
    return "risk";
  }
  // Review: missing VAT number for domestic supplier
  if (isDomestic && c.is_supplier && !c.btw_number) {
    return "review";
  }
  // Review: new contact with no default account
  if (!c.default_account_id) {
    return "review";
  }
  return "trusted";
}

function statusBadge(status: string) {
  switch (status) {
    case "trusted":
      return (
        <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px] gap-1">
          <ShieldCheck className="h-3 w-3" /> Vertrouwd
        </Badge>
      );
    case "review":
      return (
        <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border-0 text-[10px] gap-1">
          <AlertTriangle className="h-3 w-3" /> Review
        </Badge>
      );
    case "risk":
      return (
        <Badge variant="secondary" className="bg-red-500/15 text-red-400 border-0 text-[10px] gap-1">
          <AlertCircle className="h-3 w-3" /> Risico
        </Badge>
      );
    default:
      return null;
  }
}

function vatTreatment(c: any) {
  const country = c.address_country ?? "NL";
  if (country === "NL") return "Binnenland";
  if (EU_COUNTRIES.includes(country)) {
    return c.btw_number ? "ICP / Verlegd" : "EU (geen BTW nr)";
  }
  return "Export (0%)";
}

function typeBadge(c: any) {
  if (c.is_supplier && c.is_customer) {
    return <Badge variant="outline" className="text-[10px]">Beide</Badge>;
  }
  if (c.is_supplier) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Building2 className="h-3 w-3" /> Leverancier
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <User className="h-3 w-3" /> Klant
    </span>
  );
}

interface Props {
  contacts: any[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
  riskFilter: string;
}

export function ContactsTable({ contacts, isLoading, onRowClick, riskFilter }: Props) {
  const filtered = riskFilter === "all"
    ? contacts
    : contacts.filter((c) => riskStatus(c) === riskFilter);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-xs">Naam</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">Land</TableHead>
            <TableHead className="text-xs">BTW-nummer</TableHead>
            <TableHead className="text-xs">BTW-behandeling</TableHead>
            <TableHead className="text-xs">Standaard categorie</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                Geen relaties gevonden
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((c) => (
              <TableRow
                key={c.id}
                className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onRowClick(c.id)}
              >
                <TableCell className="text-sm font-medium">{c.name}</TableCell>
                <TableCell>{typeBadge(c)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.address_country ?? "NL"}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {c.btw_number || <span className="text-muted-foreground/40">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {vatTreatment(c)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.default_vat_rate_type ? (
                    <Badge variant="outline" className="text-[10px]">{c.default_vat_rate_type}</Badge>
                  ) : (
                    <span className="text-muted-foreground/40">Auto</span>
                  )}
                </TableCell>
                <TableCell>{statusBadge(riskStatus(c))}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
