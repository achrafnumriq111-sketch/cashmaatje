import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { ContactFilters as CFilters } from "@/hooks/useContacts";

interface Props {
  filters: CFilters;
  onChange: (f: CFilters) => void;
}

export function ContactFilters({ filters, onChange }: Props) {
  const set = (patch: Partial<CFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op naam of BTW-nummer..."
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="pl-9 bg-card border-border/50"
        />
      </div>

      <Select value={filters.type} onValueChange={(v) => set({ type: v as CFilters["type"] })}>
        <SelectTrigger className="w-[130px] bg-card border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle types</SelectItem>
          <SelectItem value="supplier">Leverancier</SelectItem>
          <SelectItem value="customer">Klant</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.country || "all"} onValueChange={(v) => set({ country: v })}>
        <SelectTrigger className="w-[130px] bg-card border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle landen</SelectItem>
          <SelectItem value="NL">Nederland</SelectItem>
          <SelectItem value="BE">België</SelectItem>
          <SelectItem value="DE">Duitsland</SelectItem>
          <SelectItem value="FR">Frankrijk</SelectItem>
          <SelectItem value="GB">VK</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.riskStatus} onValueChange={(v) => set({ riskStatus: v as CFilters["riskStatus"] })}>
        <SelectTrigger className="w-[140px] bg-card border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle statussen</SelectItem>
          <SelectItem value="trusted">Vertrouwd</SelectItem>
          <SelectItem value="review">Review nodig</SelectItem>
          <SelectItem value="risk">Risico</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
