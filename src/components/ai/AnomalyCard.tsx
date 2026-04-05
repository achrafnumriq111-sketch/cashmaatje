import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, ShieldAlert, Eye, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Anomaly {
  id: string;
  title: string;
  description: string;
  description_nl?: string | null;
  suggestion?: string | null;
  suggestion_nl?: string | null;
  severity: "info" | "warning" | "error" | "critical";
  anomaly_type: string;
  entity_type: string;
  entity_id: string;
  status: string;
}

interface AnomalyCardProps {
  anomaly: Anomaly;
  onView?: (anomaly: Anomaly) => void;
  onResolved?: () => void;
}

const severityConfig = {
  info: {
    icon: Info,
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    iconColor: "text-blue-500",
    pulse: false,
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-500",
    pulse: false,
  },
  error: {
    icon: AlertCircle,
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    iconColor: "text-red-500",
    pulse: false,
  },
  critical: {
    icon: ShieldAlert,
    border: "border-red-500/50",
    bg: "bg-red-500/10",
    iconColor: "text-red-500",
    pulse: true,
  },
};

export function AnomalyCard({ anomaly, onView, onResolved }: AnomalyCardProps) {
  const { user } = useAuth();
  const cfg = severityConfig[anomaly.severity] ?? severityConfig.warning;
  const Icon = cfg.icon;

  const handleResolve = async () => {
    await supabase
      .from("anomalies")
      .update({
        status: "resolved",
        resolved_by: user?.id ?? null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", anomaly.id);
    toast.success("Anomalie opgelost");
    onResolved?.();
  };

  const handleDismiss = async () => {
    await supabase
      .from("anomalies")
      .update({ status: "dismissed" })
      .eq("id", anomaly.id);
    toast("Anomalie genegeerd");
    onResolved?.();
  };

  const desc = anomaly.description_nl ?? anomaly.description;
  const suggestion = anomaly.suggestion_nl ?? anomaly.suggestion;

  return (
    <Card className={`${cfg.border} ${cfg.bg} transition-colors`}>
      <CardContent className="flex gap-3 py-4">
        <div className={`mt-0.5 shrink-0 ${cfg.iconColor} ${cfg.pulse ? "animate-pulse" : ""}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{anomaly.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          {suggestion && (
            <p className="text-xs text-primary/80">
              <span className="font-medium">Suggestie:</span> {suggestion}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            {onView && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onView(anomaly)}>
                <Eye className="mr-1 h-3 w-3" />
                Bekijken
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleResolve}>
              <CheckCircle className="mr-1 h-3 w-3" />
              Oplossen
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={handleDismiss}>
              <XCircle className="mr-1 h-3 w-3" />
              Negeren
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
