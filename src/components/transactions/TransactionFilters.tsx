import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Upload, Search } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TransactionFilters as TFilters } from "@/hooks/useTransactions";

interface Props {
  filters: TFilters;
  onChange: (f: TFilters) => void;
  bankAccounts: Array<{ id: string; name: string; iban: string }>;
  onImport: () => void;
  selectedCount: number;
}

export function TransactionFilters({ filters, onChange, bankAccounts, onImport }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
      <Select
        value={filters.bankAccountId ?? "all"}
        onValueChange={(v) => onChange({ ...filters, bankAccountId: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-full sm:w-[200px] bg-card border-border/50">
          <SelectValue placeholder="Alle rekeningen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle rekeningen</SelectItem>
          {bankAccounts.map((ba) => (
            <SelectItem key={ba.id} value={ba.id}>
              {ba.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-[220px] justify-start bg-card border-border/50">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(new Date(filters.dateFrom), "d MMM", { locale: nl })} –{" "}
            {format(new Date(filters.dateTo), "d MMM yyyy", { locale: nl })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: new Date(filters.dateFrom),
              to: new Date(filters.dateTo),
            }}
            onSelect={(range) => {
              if (range?.from) {
                onChange({
                  ...filters,
                  dateFrom: range.from.toISOString().split("T")[0],
                  dateTo: (range.to ?? range.from).toISOString().split("T")[0],
                });
              }
            }}
            className={cn("p-3 pointer-events-auto")}
            locale={nl}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v as any })}
      >
        <SelectTrigger className="w-full sm:w-[150px] bg-card border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alles</SelectItem>
          <SelectItem value="new">Nieuw</SelectItem>
          <SelectItem value="matched">Gematcht</SelectItem>
          <SelectItem value="manually_matched">Handmatig</SelectItem>
          <SelectItem value="excluded">Uitgesloten</SelectItem>
          <SelectItem value="reconciled">Afgeletterd</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op naam of omschrijving..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9 bg-card border-border/50"
        />
      </div>

      <Button variant="outline" onClick={onImport} className="w-full sm:w-auto bg-card border-border/50">
        <Upload className="mr-2 h-4 w-4" />
        Import CSV
      </Button>
    </div>
  );
}
