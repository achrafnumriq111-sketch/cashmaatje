import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  AlertOctagon,
  Clock,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import type { ChaosUpload, ChaosStatus } from "@/hooks/useChaosData";

interface Props {
  uploads: ChaosUpload[];
  isLoading?: boolean;
  retryingId: string | null;
  onRetry: (id: string) => void;
  onDelete: (upload: ChaosUpload) => void;
}

const statusConfig: Record<
  ChaosStatus,
  { label: string; tone: string; icon: typeof Clock }
> = {
  pending: {
    label: "In wachtrij",
    tone: "text-muted-foreground bg-muted/40 border-border",
    icon: Clock,
  },
  analyzing: {
    label: "AI analyseert",
    tone: "text-primary bg-primary/10 border-primary/20",
    icon: Loader2,
  },
  analyzed: {
    label: "Klaar",
    tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  failed: {
    label: "Mislukt",
    tone: "text-red-500 bg-red-500/10 border-red-500/20",
    icon: AlertOctagon,
  },
  resolved: {
    label: "Afgehandeld",
    tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
};

export function UploadStatusList({
  uploads,
  isLoading,
  retryingId,
  onRetry,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-muted/50 rounded" />
          <div className="h-10 bg-muted/50 rounded" />
        </div>
      </div>
    );
  }

  if (uploads.length === 0) return null;

  const counts = uploads.reduce(
    (acc, u) => {
      acc[u.status] = (acc[u.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Documenten ({uploads.length})
          </span>
          <div className="flex items-center gap-1.5">
            {(["pending", "analyzing", "failed", "analyzed"] as ChaosStatus[]).map(
              (s) =>
                counts[s] ? (
                  <span
                    key={s}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusConfig[s].tone}`}
                  >
                    {counts[s]} {statusConfig[s].label.toLowerCase()}
                  </span>
                ) : null,
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <ul className="divide-y border-t">
          {uploads.map((u) => {
            const cfg = statusConfig[u.status];
            const Icon = cfg.icon;
            const isInFlight = u.status === "pending" || u.status === "analyzing";
            const isRetrying = retryingId === u.id;
            return (
              <li
                key={u.id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-muted/20"
              >
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${cfg.tone}`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      u.status === "analyzing" || isRetrying ? "animate-spin" : ""
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {u.file_name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-5 ${cfg.tone}`}
                    >
                      {isRetrying ? "Opnieuw starten…" : cfg.label}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>
                      {formatDistanceToNow(new Date(u.created_at), {
                        addSuffix: true,
                        locale: nl,
                      })}
                    </span>
                    {u.status === "failed" && u.error_message && (
                      <span
                        className="text-red-500 truncate max-w-[24ch]"
                        title={u.error_message}
                      >
                        · {u.error_message}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {u.status === "failed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={isRetrying}
                      onClick={() => onRetry(u.id)}
                    >
                      <RefreshCw
                        className={`w-3 h-3 mr-1 ${
                          isRetrying ? "animate-spin" : ""
                        }`}
                      />
                      Opnieuw
                    </Button>
                  )}
                  {!isInFlight && !isRetrying && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                      onClick={() => onDelete(u)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
