import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v as IFilters["status"] })}
      >
        <SelectTrigger className="w-[160px] bg-secondary border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        className="w-[150px] bg-secondary border-border"
      />
      <span className="text-muted-foreground">t/m</span>
      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        className="w-[150px] bg-secondary border-border"
      />

      <Input
        placeholder="Zoeken..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="w-[200px] bg-secondary border-border"
      />
    </div>
  );
}
