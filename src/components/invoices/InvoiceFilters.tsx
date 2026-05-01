import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { InvoiceFilters as IFilters } from "@/hooks/useInvoices";

const STATUS_OPTIONS = [
  { value: "all", label: "Alle statussen" },
  { value: "draft", label: "Concept" },
  { value: "sent", label: "Verzonden" },
  { value: "paid", label: "Betaald" },
  { value: "overdue", label: "Verlopen" },
  { value: "cancelled", label: "Geannuleerd" },
] as const;

interface Props {
  filters: IFilters;
  onChange: (f: IFilters) => void;
}

export function InvoiceFilters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 rounded-2xl border border-border bg-card p-2">
      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v as IFilters["status"] })}
      >
        <SelectTrigger className="w-full sm:w-[170px] h-9 rounded-xl border-border/60 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          className="flex-1 sm:w-[150px] h-9 rounded-xl border-border/60 bg-background"
        />
        <span className="text-muted-foreground text-xs shrink-0">t/m</span>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          className="flex-1 sm:w-[150px] h-9 rounded-xl border-border/60 bg-background"
        />
      </div>

      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Zoeken..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9 h-9 rounded-xl border-border/60 bg-background"
        />
      </div>
    </div>
  );
}
