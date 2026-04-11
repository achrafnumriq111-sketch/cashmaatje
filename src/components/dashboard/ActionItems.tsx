import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileWarning, Calendar, GitMerge, ScanLine } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["user_role"] | undefined;

interface Props {
  unreconciledCount: number;
  missingDocsCount: number;
  pendingDocsCount: number;
  anomaliesCount: number;
  vatDeadline: { period_end: string; daysRemaining: number; period_number: number; year: number } | null | undefined;
  role: Role;
}

export function ActionItems({ unreconciledCount, missingDocsCount, pendingDocsCount, anomaliesCount, vatDeadline, role }: Props) {
  const navigate = useNavigate();

  const items = [
    ...(role !== "entrepreneur"
      ? [{
          icon: GitMerge,
          label: "Niet-afgeletterde transacties",
          count: unreconciledCount,
          color: "text-amber-400",
          bg: "bg-amber-400/10",
          onClick: () => navigate("/reconciliatie"),
        }]
      : []),
    {
      icon: ScanLine,
      label: "Bonnen in verwerking",
      count: pendingDocsCount,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      onClick: () => navigate("/bonnen"),
    },
    {
      icon: FileWarning,
      label: role === "entrepreneur" ? "Ontbrekende bonnetjes" : "Ontbrekende documenten",
      count: missingDocsCount,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      onClick: () => navigate("/documenten"),
    },
    ...(vatDeadline
      ? [{
          icon: Calendar,
          label: `BTW aangifte Q${vatDeadline.period_number} ${vatDeadline.year}`,
          count: vatDeadline.daysRemaining,
          suffix: vatDeadline.daysRemaining === 1 ? "dag" : "dagen",
          color: vatDeadline.daysRemaining <= 7 ? "text-red-400" : "text-blue-400",
          bg: vatDeadline.daysRemaining <= 7 ? "bg-red-400/10" : "bg-blue-400/10",
          onClick: () => navigate("/btw/aangifte"),
        }]
      : []),
    {
      icon: AlertTriangle,
      label: role === "entrepreneur" ? "Aandachtspunten" : "Anomalieën",
      count: anomaliesCount,
      color: "text-red-400",
      bg: "bg-red-400/10",
      onClick: () => navigate("/reconciliatie"),
    },
  ];

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">Actiepunten</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex items-center gap-3 w-full py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
            >
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-semibold ${item.color}`}>{item.count}</span>
                {"suffix" in item && <span className="text-xs text-muted-foreground">{(item as any).suffix}</span>}
              </div>
            </button>
          ))}
          {items.every((i) => i.count === 0) && (
            <p className="text-sm text-muted-foreground text-center py-6">Alles is up-to-date 🎉</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
