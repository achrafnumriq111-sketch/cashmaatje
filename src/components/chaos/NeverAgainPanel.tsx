import { Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useChaosData } from "@/hooks/useChaosData";

const defaults: { rule_type: string; label: string; cadence: string }[] = [
  { rule_type: "vat_quarterly", label: "BTW-aangifte herinnering (per kwartaal)", cadence: "quarterly" },
  { rule_type: "ib_yearly", label: "Inkomstenbelasting deadline (jaarlijks)", cadence: "yearly" },
  { rule_type: "payroll_monthly", label: "Loonheffing aangifte (maandelijks)", cadence: "monthly" },
  { rule_type: "payment_alert", label: "Betaalwaarschuwing bij dwangbevel-trigger", cadence: "event" },
];

export function NeverAgainPanel() {
  const { preventionRules, togglePreventionRule } = useChaosData();
  const list = preventionRules.data ?? [];

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Nooit meer in chaos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Activeer de bewakers die voorkómen dat je opnieuw in deze situatie belandt.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {defaults.map((d) => {
          const existing = list.find((r) => r.rule_type === d.rule_type);
          const active = existing?.is_active ?? false;
          return (
            <label
              key={d.rule_type}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="text-sm text-foreground">{d.label}</div>
              <Switch
                checked={active}
                onCheckedChange={(checked) =>
                  togglePreventionRule.mutate({
                    rule_type: d.rule_type,
                    label: d.label,
                    cadence: d.cadence,
                    is_active: checked,
                    existing_id: existing?.id,
                  })
                }
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
