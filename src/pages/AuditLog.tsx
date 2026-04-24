import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { pageTransition, cardVariant } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Loader2, Search, Download, ShieldAlert } from "lucide-react";
import { exportToExcel } from "@/lib/exportUtils";
import { format } from "date-fns";

interface AuditRow {
  id: string;
  created_at: string;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  change_summary: string | null;
}

const PAGE_SIZE = 50;

export default function AuditLog() {
  const { membership } = useOrganization();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");
  const [entity, setEntity] = useState<string>("all");

  const load = async () => {
    if (!membership) return;
    setLoading(true);
    let q = supabase
      .from("audit_log")
      .select("id,created_at,user_email,user_role,action,entity_type,entity_id,change_summary", { count: "exact" })
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (action !== "all") q = q.eq("action", action);
    if (entity !== "all") q = q.eq("entity_type", entity);
    if (search) q = q.ilike("change_summary", `%${search}%`);

    const { data, error, count } = await q;
    if (error) {
      if (error.code === "42501" || error.message.toLowerCase().includes("permission")) setDenied(true);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as AuditRow[]);
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [membership?.organizationId, page, action, entity]);

  const actionTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.action))), [rows]);
  const entityTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.entity_type))), [rows]);

  const exportCsv = () => {
    exportToExcel(rows, [
      { header: "Datum", key: "created_at" },
      { header: "Gebruiker", key: "user_email" },
      { header: "Rol", key: "user_role" },
      { header: "Actie", key: "action" },
      { header: "Entiteit", key: "entity_type" },
      { header: "Samenvatting", key: "change_summary" },
    ], `audit-log-${format(new Date(), "yyyy-MM-dd")}`);
  };

  const actionColor = (a: string) => {
    if (a.includes("delete")) return "destructive";
    if (a.includes("create") || a.includes("insert")) return "default";
    if (a.includes("update")) return "secondary";
    return "outline";
  };

  if (denied) {
    return (
      <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">Geen toegang</h2>
            <p className="text-sm text-muted-foreground">Alleen beheerders en accountants kunnen het audit-log inzien.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-4">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit-log</h1>
          <p className="mt-1 text-sm text-muted-foreground">Volledige geschiedenis van wijzigingen in deze organisatie.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="h-3.5 w-3.5 mr-1.5" />Exporteer
        </Button>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Zoek samenvatting..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (setPage(0), load())} className="pl-8" />
            </div>
            <Select value={action} onValueChange={(v) => { setPage(0); setAction(v); }}>
              <SelectTrigger><SelectValue placeholder="Actie" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Alle acties</SelectItem>{actionTypes.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={entity} onValueChange={(v) => { setPage(0); setEntity(v); }}>
              <SelectTrigger><SelectValue placeholder="Entiteit" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Alle entiteiten</SelectItem>{entityTypes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Nog geen audit-events.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Gebruiker</TableHead>
                  <TableHead>Actie</TableHead>
                  <TableHead>Entiteit</TableHead>
                  <TableHead>Samenvatting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">{format(new Date(r.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
                    <TableCell className="text-xs">{r.user_email ?? "system"}{r.user_role && <span className="text-muted-foreground"> · {r.user_role}</span>}</TableCell>
                    <TableCell><Badge variant={actionColor(r.action) as never}>{r.action}</Badge></TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{r.entity_type}</TableCell>
                    <TableCell className="text-sm">{r.change_summary ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Pagina {page + 1} van {Math.ceil(total / PAGE_SIZE)} ({total} events)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Vorige</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}>Volgende</Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
