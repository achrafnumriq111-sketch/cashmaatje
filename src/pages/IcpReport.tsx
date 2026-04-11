import { useState } from "react";
import { useIcpReport, IcpLineData } from "@/hooks/useIcpReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, CheckCircle2, Download, FileText, Globe, Loader2,
  Save, Send, ShieldAlert, Users, ChevronDown, ChevronRight, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v);

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const FLAG_EMOJI: Record<string, string> = {
  AT: "🇦🇹", BE: "🇧🇪", BG: "🇧🇬", HR: "🇭🇷", CY: "🇨🇾", CZ: "🇨🇿",
  DK: "🇩🇰", EE: "🇪🇪", FI: "🇫🇮", FR: "🇫🇷", DE: "🇩🇪", GR: "🇬🇷",
  HU: "🇭🇺", IE: "🇮🇪", IT: "🇮🇹", LV: "🇱🇻", LT: "🇱🇹", LU: "🇱🇺",
  MT: "🇲🇹", PL: "🇵🇱", PT: "🇵🇹", RO: "🇷🇴", SK: "🇸🇰", SI: "🇸🇮",
  ES: "🇪🇸", SE: "🇸🇪",
};

export default function IcpReport() {
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const {
    lines, summary, isLoading, report, reportLoading,
    saveReport, exportJson, exportCsv,
  } = useIcpReport(year, quarter);

  const status = report?.status ?? "draft";

  const statusBadge = (s: string) => {
    switch (s) {
      case "submitted":
        return <Badge className="bg-primary/20 text-primary border-primary/30"><CheckCircle2 className="h-3 w-3 mr-1" />Ingediend</Badge>;
      case "ready":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><FileText className="h-3 w-3 mr-1" />Gereed</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground"><FileText className="h-3 w-3 mr-1" />Concept</Badge>;
    }
  };

  const toggleRow = (vatNumber: string) => {
    setExpandedRow(expandedRow === vatNumber ? null : vatNumber);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">ICP-opgave</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Intracommunautaire prestaties · Automatisch gegenereerd uit je boekhouding
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(status)}
          <Button variant="outline" size="sm" onClick={exportJson}>
            <Download className="h-4 w-4 mr-1" />JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" />CSV
          </Button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Q1 (jan – mrt)</SelectItem>
            <SelectItem value="2">Q2 (apr – jun)</SelectItem>
            <SelectItem value="3">Q3 (jul – sep)</SelectItem>
            <SelectItem value="4">Q4 (okt – dec)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveReport.mutate("draft")}
            disabled={saveReport.isPending || lines.length === 0}
          >
            <Save className="h-4 w-4 mr-1" />Opslaan
          </Button>
          <Button
            size="sm"
            onClick={() => saveReport.mutate("ready")}
            disabled={saveReport.isPending || lines.length === 0 || summary.warningCount > 0}
          >
            <Send className="h-4 w-4 mr-1" />Gereedmelden
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Totaal ICP-omzet"
          value={fmt(summary.totalAmount)}
          icon={<Globe className="h-4 w-4 text-primary" />}
        />
        <SummaryCard
          title="Leveringen"
          value={fmt(summary.totalGoods)}
          icon={<FileText className="h-4 w-4 text-blue-400" />}
        />
        <SummaryCard
          title="Diensten"
          value={fmt(summary.totalServices)}
          icon={<FileText className="h-4 w-4 text-violet-400" />}
        />
        <SummaryCard
          title="EU-klanten"
          value={String(summary.customerCount)}
          icon={<Users className="h-4 w-4 text-amber-400" />}
        />
        <SummaryCard
          title="Waarschuwingen"
          value={String(summary.warningCount)}
          icon={summary.warningCount > 0
            ? <AlertTriangle className="h-4 w-4 text-destructive" />
            : <CheckCircle2 className="h-4 w-4 text-primary" />
          }
        />
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
        <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Automatisch gegenereerd</p>
          <p className="mt-0.5">
            Alle EU B2B-transacties met BTW-verlegging worden automatisch gedetecteerd uit je journaalposten.
            Handmatige invoer is niet mogelijk — dit garandeert nauwkeurigheid en traceerbaarheid.
          </p>
        </div>
      </div>

      {/* Main table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : lines.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Geen ICP-transacties gevonden</p>
            <p className="text-sm text-muted-foreground mt-1">
              Er zijn geen EU B2B-transacties met BTW-verlegging in Q{quarter} {year}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              ICP-regels · {lines.length} relatie{lines.length !== 1 ? "s" : ""} · {summary.transactionCount} transactie{summary.transactionCount !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>BTW-nummer</TableHead>
                  <TableHead>Bedrijfsnaam</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead className="text-right">Leveringen</TableHead>
                  <TableHead className="text-right">Diensten</TableHead>
                  <TableHead className="text-right">Totaal</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <IcpRow
                    key={line.vatNumber}
                    line={line}
                    expanded={expandedRow === line.vatNumber}
                    onToggle={() => toggleRow(line.vatNumber)}
                  />
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell />
                  <TableCell colSpan={3} className="text-foreground">Totaal</TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">{fmt(summary.totalGoods)}</TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">{fmt(summary.totalServices)}</TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">{fmt(summary.totalAmount)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Compliance note */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
        <ShieldAlert className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Compliance-regels</p>
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            <li>Alleen geldige EU B2B-transacties met BTW-verlegging worden opgenomen</li>
            <li>Gegroepeerd per BTW-nummer per kwartaal</li>
            <li>Binnenlandse (NL) en B2C-transacties worden automatisch uitgesloten</li>
            <li>BTW-nummers worden gevalideerd op format en landprefix</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          {icon}
        </div>
        <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function IcpRow({ line, expanded, onToggle }: { line: IcpLineData; expanded: boolean; onToggle: () => void }) {
  const hasWarnings = line.warnings.length > 0;
  const flag = FLAG_EMOJI[line.country] || "";

  return (
    <>
      <TableRow
        className={cn("cursor-pointer hover:bg-muted/40", expanded && "bg-muted/20")}
        onClick={onToggle}
      >
        <TableCell className="w-8 px-3">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </TableCell>
        <TableCell className="font-mono text-sm text-foreground">{line.vatNumber}</TableCell>
        <TableCell className="text-foreground">{line.contactName}</TableCell>
        <TableCell>
          <span className="text-foreground">{flag} {line.country}</span>
        </TableCell>
        <TableCell className="text-right tabular-nums text-foreground">{fmt(line.goodsAmount)}</TableCell>
        <TableCell className="text-right tabular-nums text-foreground">{fmt(line.servicesAmount)}</TableCell>
        <TableCell className="text-right tabular-nums font-medium text-foreground">{fmt(line.totalAmount)}</TableCell>
        <TableCell className="text-center">
          {hasWarnings ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {line.warnings.length}
            </Badge>
          ) : (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />OK
            </Badge>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded detail */}
      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/10 p-0">
            <div className="px-6 py-4 space-y-3">
              {/* Warnings */}
              {hasWarnings && (
                <div className="space-y-1">
                  {line.warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Transaction detail */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Onderliggende journaalposten ({line.transactionCount})
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Datum</TableHead>
                      <TableHead className="text-xs">Omschrijving</TableHead>
                      <TableHead className="text-xs">BTW-box</TableHead>
                      <TableHead className="text-xs text-right">Bedrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {line.journalEntries.map((je) => (
                      <TableRow key={je.id}>
                        <TableCell className="text-xs text-foreground">{je.date}</TableCell>
                        <TableCell className="text-xs text-foreground">{je.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{je.vatBox}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right tabular-nums text-foreground">{fmt(je.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
