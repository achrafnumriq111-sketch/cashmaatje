import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AiConfidenceBadge } from "./AiConfidenceBadge";
import { AiReasoningPanel } from "./AiReasoningPanel";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";

interface AiDecision {
  id: string;
  action_type: string;
  input_type: string;
  input_summary: string | null;
  confidence: number;
  reasoning: string;
  reasoning_nl: string | null;
  decision: any;
  factors: any;
  alternatives: any;
  was_accepted: boolean | null;
  was_overridden: boolean | null;
  created_at: string | null;
}

export function AiDecisionLog() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [decisions, setDecisions] = useState<AiDecision[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<AiDecision | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const q = supabase
      .from("ai_decisions")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(200);

    q.then(({ data }) => {
      setDecisions((data ?? []) as AiDecision[]);
      setLoading(false);
    });
  }, [orgId]);

  const filtered = useMemo(
    () => (typeFilter === "all" ? decisions : decisions.filter((d) => d.action_type === typeFilter)),
    [decisions, typeFilter]
  );

  const actionLabel = (t: string) => {
    const map: Record<string, string> = {
      categorize: "Categoriseren",
      ocr: "OCR",
      match: "Matching",
      validate: "Validatie",
      reconcile: "Reconciliatie",
    };
    return map[t] ?? t;
  };

  const statusBadge = (d: AiDecision) => {
    if (d.was_overridden) return <Badge variant="outline" className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[11px]">Overschreven</Badge>;
    if (d.was_accepted) return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">Geaccepteerd</Badge>;
    return <Badge variant="outline" className="text-[11px]">In afwachting</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-beslissingen
          </CardTitle>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typen</SelectItem>
              <SelectItem value="categorize">Categoriseren</SelectItem>
              <SelectItem value="ocr">OCR</SelectItem>
              <SelectItem value="match">Matching</SelectItem>
              <SelectItem value="validate">Validatie</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Laden...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoer</TableHead>
                  <TableHead>Zekerheid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Geen AI-beslissingen gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d) => (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(d)}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {d.created_at ? format(new Date(d.created_at), "dd-MM-yyyy HH:mm") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[11px]">{actionLabel(d.action_type)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {d.input_summary ?? "—"}
                      </TableCell>
                      <TableCell>
                        <AiConfidenceBadge confidence={d.confidence} />
                      </TableCell>
                      <TableCell>{statusBadge(d)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI-beslissing details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <AiReasoningPanel
                action={actionLabel(selected.action_type)}
                confidence={selected.confidence}
                reasoning={selected.reasoning}
                reasoningNl={selected.reasoning_nl ?? undefined}
                factors={Array.isArray(selected.factors) ? selected.factors : undefined}
                alternatives={Array.isArray(selected.alternatives) ? selected.alternatives : undefined}
              />
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
                <p className="mb-1 font-medium uppercase tracking-wide text-muted-foreground">Beslissing (JSON)</p>
                <pre className="overflow-auto whitespace-pre-wrap text-foreground">
                  {JSON.stringify(selected.decision, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
