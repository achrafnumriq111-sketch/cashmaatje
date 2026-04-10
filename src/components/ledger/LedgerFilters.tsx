import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import type { LedgerFilters as Filters } from "@/hooks/useGeneralLedger";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onExport: () => void;
}

export function LedgerFilters({ filters, onChange, onExport }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam of nummer..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-8"
          />
        </div>
        <Select value={filters.accountType} onValueChange={(v: any) => onChange({ ...filters, accountType: v })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typen</SelectItem>
            <SelectItem value="asset">Activa</SelectItem>
            <SelectItem value="liability">Passiva</SelectItem>
            <SelectItem value="equity">Eigen vermogen</SelectItem>
            <SelectItem value="revenue">Omzet</SelectItem>
            <SelectItem value="expense">Kosten</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.activity} onValueChange={(v: any) => onChange({ ...filters, activity: v })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle rekeningen</SelectItem>
            <SelectItem value="active">Met mutaties</SelectItem>
            <SelectItem value="inactive">Zonder mutaties</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Exporteer
      </Button>
    </div>
  );
}
