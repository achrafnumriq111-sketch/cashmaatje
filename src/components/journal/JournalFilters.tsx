import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import type { JournalFilters as JFilters } from "@/hooks/useJournalEntries";

interface Props {
  filters: JFilters;
  onChange: (f: JFilters) => void;
  onExport: () => void;
}

export function JournalFilters({ filters, onChange, onExport }: Props) {
  const set = (patch: Partial<JFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op omschrijving..."
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="pl-9 bg-card border-border/50"
        />
      </div>

      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => set({ dateFrom: e.target.value })}
        className="w-[140px] bg-card border-border/50"
      />
      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => set({ dateTo: e.target.value })}
        className="w-[140px] bg-card border-border/50"
      />

      <Select value={filters.status} onValueChange={(v) => set({ status: v as JFilters["status"] })}>
        <SelectTrigger className="w-[130px] bg-card border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle statussen</SelectItem>
          <SelectItem value="draft">Concept</SelectItem>
          <SelectItem value="posted">Geboekt</SelectItem>
          <SelectItem value="voided">Ongeldig</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sourceType} onValueChange={(v) => set({ sourceType: v as JFilters["sourceType"] })}>
        <SelectTrigger className="w-[130px] bg-card border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle bronnen</SelectItem>
          <SelectItem value="invoice">Factuur</SelectItem>
          <SelectItem value="bank_transaction">Bank</SelectItem>
          <SelectItem value="system">Systeem</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
        <Download className="h-4 w-4" />
        Exporteer
      </Button>
    </div>
  );
}
