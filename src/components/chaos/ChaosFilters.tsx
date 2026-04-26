import { useMemo } from "react";
import { X, Filter as FilterIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type {
  ChaosItem,
  ChaosPriority,
  ConfidenceBand,
  UrgencyLane,
} from "@/hooks/useChaosData";

export interface ChaosFilterState {
  priority: ChaosPriority | "all";
  urgencyLane: UrgencyLane | "all";
  confidenceBand: ConfidenceBand | "all";
  hasMissingDocs: boolean;
  hasRiskTimeline: boolean;
}

export const defaultChaosFilters: ChaosFilterState = {
  priority: "all",
  urgencyLane: "all",
  confidenceBand: "all",
  hasMissingDocs: false,
  hasRiskTimeline: false,
};

export function applyChaosFilters(items: ChaosItem[], f: ChaosFilterState): ChaosItem[] {
  return items.filter((i) => {
    if (f.priority !== "all" && i.priority !== f.priority) return false;
    if (f.urgencyLane !== "all") {
      const lane = i.urgency_lane ?? "later";
      if (lane !== f.urgencyLane) return false;
    }
    if (f.confidenceBand !== "all" && i.confidence_band !== f.confidenceBand) return false;
    if (f.hasMissingDocs && !(i.missing_documents && i.missing_documents.length > 0)) return false;
    if (f.hasRiskTimeline && !(i.risk_timeline && i.risk_timeline.length > 0)) return false;
    return true;
  });
}

export function activeFilterCount(f: ChaosFilterState): number {
  let n = 0;
  if (f.priority !== "all") n++;
  if (f.urgencyLane !== "all") n++;
  if (f.confidenceBand !== "all") n++;
  if (f.hasMissingDocs) n++;
  if (f.hasRiskTimeline) n++;
  return n;
}

interface Props {
  value: ChaosFilterState;
  onChange: (next: ChaosFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function ChaosFilters({ value, onChange, totalCount, filteredCount }: Props) {
  const count = useMemo(() => activeFilterCount(value), [value]);
  const set = <K extends keyof ChaosFilterState>(k: K, v: ChaosFilterState[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {count > 0 && (
            <Badge variant="secondary" className="h-5 text-[10px]">
              {count} actief
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {filteredCount} / {totalCount}
          </span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange(defaultChaosFilters)}
            >
              <X className="w-3 h-3 mr-1" />
              Wissen
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Prioriteit
          </label>
          <Select
            value={value.priority}
            onValueChange={(v) => set("priority", v as ChaosFilterState["priority"])}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle prioriteiten</SelectItem>
              <SelectItem value="red">Urgent</SelectItem>
              <SelectItem value="orange">Belangrijk</SelectItem>
              <SelectItem value="green">Laag</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Urgentie-baan
          </label>
          <Select
            value={value.urgencyLane}
            onValueChange={(v) => set("urgencyLane", v as ChaosFilterState["urgencyLane"])}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle banen</SelectItem>
              <SelectItem value="today">Vandaag</SelectItem>
              <SelectItem value="this_week">Deze week</SelectItem>
              <SelectItem value="later">Later</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            AI-zekerheid
          </label>
          <Select
            value={value.confidenceBand}
            onValueChange={(v) =>
              set("confidenceBand", v as ChaosFilterState["confidenceBand"])
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle niveaus</SelectItem>
              <SelectItem value="high">Hoog</SelectItem>
              <SelectItem value="medium">Gemiddeld</SelectItem>
              <SelectItem value="low">Laag</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-1">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch
            checked={value.hasMissingDocs}
            onCheckedChange={(v) => set("hasMissingDocs", v)}
          />
          <span className="text-foreground">Met ontbrekende documenten</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch
            checked={value.hasRiskTimeline}
            onCheckedChange={(v) => set("hasRiskTimeline", v)}
          />
          <span className="text-foreground">Met risico-tijdlijn</span>
        </label>
      </div>
    </div>
  );
}
