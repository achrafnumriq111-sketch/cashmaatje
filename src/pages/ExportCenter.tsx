import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileSpreadsheet, FileText, Download, Receipt, FileBarChart, ArrowLeftRight, Building2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { exportInvoicesPDF, exportTransactionsPDF } from "@/lib/pdfExport";
import { exportToExcel, exportMultiSheet, type ExportColumn } from "@/lib/exportUtils";

type Format = "pdf" | "xlsx" | "csv";

const startOfYear = () => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

const fmtMoney = (n: number) => new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2 }).format(n || 0);

function downloadCSV(rows: Record<string, any>[], columns: ExportColumn[], fileName: string) {
  const header = columns.map((c) => `"${c.header}"`).join(",");
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          const v = r[c.key];
          if (v == null) return "";
          const s = typeof v === "number" ? String(v) : String(v).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    )
    .join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface ExportItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  formats: Format[];
}

const EXPORTS: ExportItem[] = [
  {
    id: "sales",
    title: "Verkoopfacturen",
    description: "Alle verkoopfacturen in periode incl. BTW-totalen",
    icon: <FileText className="h-4 w-4" />,
    formats: ["pdf", "xlsx", "csv"],
  },
  {
    id: "purchase",
    title: "Inkoopfacturen",
    description: "Alle inkoopfacturen incl. BTW-aftrekbaar",
    icon: <Receipt className="h-4 w-4" />,
    formats: ["pdf", "xlsx", "csv"],
  },
  {
    id: "transactions",
    title: "Banktransacties",
    description: "Alle bankboekingen in periode",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    formats: ["pdf", "xlsx", "csv"],
  },
  {
    id: "vat",
    title: "BTW-rapportage",
    description: "Volledige BTW-aangifte per kwartaal",
    icon: <FileBarChart className="h-4 w-4" />,
    formats: ["pdf", "xlsx"],
  },
  {
    id: "ledger",
    title: "Grootboek",
    description: "Alle journaalposten per rekening",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    formats: ["xlsx", "csv"],
  },
  {
    id: "contacts",
    title: "Relaties",
    description: "Klanten en leveranciers met saldi",
    icon: <Building2 className="h-4 w-4" />,
    formats: ["xlsx", "csv"],
  },
];

export default function ExportCenter() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [dateFrom, setDateFrom] = useState(startOfYear());
  const [dateTo, setDateTo] = useState(today());
  const [busyId, setBusyId] = useState<string | null>(null);

  // History — last 5 exports stored client-side
  const [history, setHistory] = useState<{ title: string; format: string; at: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("export-history") ?? "[]");
    } catch { return []; }
  });

  const recordHistory = (title: string, format: string) => {
    const entry = { title, format, at: new Date().toISOString() };
    const next = [entry, ...history].slice(0, 8);
    setHistory(next);
    localStorage.setItem("export-history", JSON.stringify(next));
  };

  const handleExport = async (item: ExportItem, format: Format) => {
    if (!orgId) return;
    setBusyId(`${item.id}-${format}`);
    try {
      if (item.id === "sales" || item.id === "purchase") {
        const type = item.id;
        const { data, error } = await supabase
          .from("invoices")
          .select("invoice_number, invoice_date, contact_name, subtotal, total_vat, total_amount, status, due_date")
          .eq("organization_id", orgId)
          .eq("invoice_type", type)
          .gte("invoice_date", dateFrom)
          .lte("invoice_date", dateTo)
          .order("invoice_date", { ascending: false });
        if (error) throw error;
        const rows = data ?? [];
        if (rows.length === 0) {
          toast.warning("Geen facturen in deze periode");
          return;
        }
        if (format === "pdf") {
          exportInvoicesPDF({ type, invoices: rows as any, dateFrom, dateTo });
        } else {
          const cols: ExportColumn[] = [
            { header: "Nummer", key: "invoice_number" },
            { header: "Datum", key: "invoice_date", format: "date" },
            { header: "Relatie", key: "contact_name" },
            { header: "Subtotaal", key: "subtotal", format: "currency" },
            { header: "BTW", key: "total_vat", format: "currency" },
            { header: "Totaal", key: "total_amount", format: "currency" },
            { header: "Status", key: "status" },
            { header: "Vervaldatum", key: "due_date", format: "date" },
          ];
          if (format === "xlsx") exportToExcel(rows as any, cols, `${type}-${dateFrom}_${dateTo}`);
          else downloadCSV(rows as any, cols, `${type}-${dateFrom}_${dateTo}`);
        }
      } else if (item.id === "transactions") {
        const { data, error } = await supabase
          .from("bank_transactions")
          .select("transaction_date, description, counterparty_name, amount, status, account_id, accounts(code, name, name_nl)")
          .eq("organization_id", orgId)
          .gte("transaction_date", dateFrom)
          .lte("transaction_date", dateTo)
          .order("transaction_date", { ascending: false });
        if (error) throw error;
        const rows = data ?? [];
        if (rows.length === 0) {
          toast.warning("Geen transacties in deze periode");
          return;
        }
        if (format === "pdf") {
          exportTransactionsPDF({ transactions: rows as any, dateFrom, dateTo });
        } else {
          const cols: ExportColumn[] = [
            { header: "Datum", key: "transaction_date", format: "date" },
            { header: "Tegenpartij", key: "counterparty_name" },
            { header: "Omschrijving", key: "description" },
            { header: "Bedrag", key: "amount", format: "currency" },
            { header: "Status", key: "status" },
          ];
          if (format === "xlsx") exportToExcel(rows as any, cols, `transacties-${dateFrom}_${dateTo}`);
          else downloadCSV(rows as any, cols, `transacties-${dateFrom}_${dateTo}`);
        }
      } else if (item.id === "vat") {
        const { data: lines, error } = await supabase
          .from("journal_lines")
          .select("vat_box, vat_amount, vat_percentage, debit_amount, credit_amount, journal_entries(date)")
          .not("vat_box", "is", null)
          .gte("journal_entries.date", dateFrom)
          .lte("journal_entries.date", dateTo);
        if (error) throw error;
        const rows = lines ?? [];
        if (rows.length === 0) {
          toast.warning("Geen BTW-mutaties in deze periode");
          return;
        }
        const cols: ExportColumn[] = [
          { header: "Datum", key: "date" },
          { header: "Rubriek", key: "vat_box" },
          { header: "Tarief", key: "vat_percentage" },
          { header: "Grondslag", key: "base", format: "currency" },
          { header: "BTW", key: "vat_amount", format: "currency" },
        ];
        const flat = rows.map((r: any) => ({
          date: r.journal_entries?.date,
          vat_box: r.vat_box,
          vat_percentage: r.vat_percentage,
          base: (r.debit_amount || 0) + (r.credit_amount || 0) - (r.vat_amount || 0),
          vat_amount: r.vat_amount || 0,
        }));
        if (format === "xlsx") exportToExcel(flat, cols, `btw-${dateFrom}_${dateTo}`);
        else if (format === "pdf") {
          // Use simple invoice-style PDF route
          toast.info("Gebruik 'BTW-aangifte' pagina voor volledige PDF-aangifte");
          return;
        }
      } else if (item.id === "ledger") {
        const { data, error } = await supabase
          .from("journal_lines")
          .select("debit_amount, credit_amount, description, accounts(code, name, name_nl), journal_entries!inner(date, description, organization_id)")
          .eq("journal_entries.organization_id", orgId)
          .gte("journal_entries.date", dateFrom)
          .lte("journal_entries.date", dateTo);
        if (error) throw error;
        const flat = (data ?? []).map((r: any) => ({
          date: r.journal_entries?.date,
          account_code: r.accounts?.code,
          account_name: r.accounts?.name_nl ?? r.accounts?.name,
          description: r.description ?? r.journal_entries?.description,
          debit: r.debit_amount,
          credit: r.credit_amount,
        }));
        if (flat.length === 0) {
          toast.warning("Geen mutaties in deze periode");
          return;
        }
        const cols: ExportColumn[] = [
          { header: "Datum", key: "date", format: "date" },
          { header: "Rekening", key: "account_code" },
          { header: "Naam", key: "account_name" },
          { header: "Omschrijving", key: "description" },
          { header: "Debet", key: "debit", format: "currency" },
          { header: "Credit", key: "credit", format: "currency" },
        ];
        if (format === "xlsx") exportToExcel(flat, cols, `grootboek-${dateFrom}_${dateTo}`);
        else downloadCSV(flat, cols, `grootboek-${dateFrom}_${dateTo}`);
      } else if (item.id === "contacts") {
        const { data, error } = await supabase
          .from("contacts")
          .select("name, legal_name, btw_number, kvk_number, email, phone, address_country, is_customer, is_supplier, payment_terms_days")
          .eq("organization_id", orgId)
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        const rows = data ?? [];
        if (rows.length === 0) {
          toast.warning("Geen relaties");
          return;
        }
        const cols: ExportColumn[] = [
          { header: "Naam", key: "name" },
          { header: "Juridische naam", key: "legal_name" },
          { header: "BTW-nummer", key: "btw_number" },
          { header: "KVK", key: "kvk_number" },
          { header: "Email", key: "email" },
          { header: "Telefoon", key: "phone" },
          { header: "Land", key: "address_country" },
          { header: "Klant", key: "is_customer" },
          { header: "Leverancier", key: "is_supplier" },
          { header: "Betaaltermijn", key: "payment_terms_days" },
        ];
        if (format === "xlsx") exportToExcel(rows as any, cols, `relaties-${today()}`);
        else downloadCSV(rows as any, cols, `relaties-${today()}`);
      }
      recordHistory(item.title, format.toUpperCase());
      toast.success(`${item.title} (${format.toUpperCase()}) gedownload`);
    } catch (e) {
      console.error(e);
      toast.error("Export mislukt: " + (e instanceof Error ? e.message : "onbekende fout"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-5 max-w-[1200px]"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Export Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Eén plek voor alle exports — PDF voor delen, XLSX of CSV voor bewerken.
        </p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-w-md">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Van</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Tot</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {EXPORTS.map((item) => {
          return (
            <Card key={item.id} className="p-4 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                </div>
              </div>
              <div className="flex gap-1.5 mt-auto pt-2">
                {item.formats.map((f) => {
                  const busy = busyId === `${item.id}-${f}`;
                  return (
                    <Button
                      key={f}
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleExport(item, f)}
                      disabled={busy || !!busyId}
                    >
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
                      {f.toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </motion.div>

      {history.length > 0 && (
        <motion.div variants={fadeInUp}>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Recente exports</h2>
          <Card className="p-3 divide-y divide-border">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{h.title}</span>
                  <span className="text-xs text-muted-foreground">· {h.format}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(h.at).toLocaleString("nl-NL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
