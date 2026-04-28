import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Upload, FileUp } from "lucide-react";
import { useState, useCallback } from "react";
import { useImportTransactions, useCategorizeTransactions } from "@/hooks/useTransactions";
import { parseCsv, parseAmount } from "@/lib/csvImport";
import { toast } from "sonner";

type BankFormat = "generic" | "ing" | "rabobank" | "abn_amro";

interface ColumnMapping {
  date: number;
  amount: number;
  description: number;
  counterparty: number;
  reference: number;
  iban: number;
}

const PRESET_MAPPINGS: Record<BankFormat, Partial<ColumnMapping>> = {
  generic: {},
  ing: { date: 0, counterparty: 1, description: 8, amount: 6, reference: 9, iban: 3 },
  rabobank: { date: 4, counterparty: 9, description: 19, amount: 6, reference: 16, iban: 8 },
  abn_amro: { date: 2, counterparty: 5, description: 7, amount: 6, reference: 8, iban: 3 },
};

interface Props {
  open: boolean;
  onClose: () => void;
  bankAccounts: Array<{ id: string; name: string }>;
}

export function CsvImportModal({ open, onClose, bankAccounts }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [format, setFormat] = useState<BankFormat>("generic");
  const [bankAccountId, setBankAccountId] = useState("");
  const [mapping, setMapping] = useState<ColumnMapping>({ date: 0, amount: 1, description: 2, counterparty: 3, reference: 4, iban: 5 });

  const importTx = useImportTransactions();
  const categorizeTx = useCategorizeTransactions();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.length > 0) {
        setHeaders(parsed[0]);
        setRows(parsed.slice(1, 11));
      }
    };
    reader.readAsText(f);
  }, []);

  const handleFormatChange = (f: BankFormat) => {
    setFormat(f);
    const preset = PRESET_MAPPINGS[f];
    if (Object.keys(preset).length > 0) {
      setMapping({ ...mapping, ...preset } as ColumnMapping);
    }
  };

  const handleImport = async () => {
    if (!bankAccountId) { toast.error("Selecteer een bankrekening"); return; }
    if (rows.length === 0) { toast.error("Geen data om te importeren"); return; }

    try {
      const allLines = file ? await readAllRows(file) : rows;
      const parsed = allLines.map((row) => {
        const rawAmount = row[mapping.amount] || "0";
        const amount = parseFloat(rawAmount.replace(/\./g, "").replace(",", ".")) || 0;
        const rawDate = row[mapping.date] || "";
        const date = parseDate(rawDate);

        return {
          transaction_date: date,
          amount,
          description: row[mapping.description] || "",
          counterparty_name: row[mapping.counterparty] || "",
          payment_reference: row[mapping.reference] || undefined,
          counterparty_iban: row[mapping.iban] || undefined,
        };
      }).filter((r) => r.transaction_date && !isNaN(r.amount));

      const newIds = await importTx.mutateAsync({ bankAccountId, rows: parsed });
      toast.success(`${newIds.length} transacties geïmporteerd`);

      // Auto-categorize
      if (newIds.length > 0) {
        toast.info("AI categorisatie gestart...");
        categorizeTx.mutate(newIds);
      }

      onClose();
      setFile(null);
      setRows([]);
    } catch (err: any) {
      toast.error("Import mislukt: " + (err.message || "onbekende fout"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>CSV Importeren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Bankrekening</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder="Selecteer rekening" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((ba) => (
                    <SelectItem key={ba.id} value={ba.id}>{ba.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Bankformaat</Label>
              <Select value={format} onValueChange={(v) => handleFormatChange(v as BankFormat)}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">Generiek CSV</SelectItem>
                  <SelectItem value="ing">ING</SelectItem>
                  <SelectItem value="rabobank">Rabobank</SelectItem>
                  <SelectItem value="abn_amro">ABN AMRO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!file ? (
            <label className="flex flex-col items-center justify-center gap-2 py-12 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <FileUp className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Klik of sleep een CSV bestand</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{file.name} — {rows.length} rijen voorbeeld</p>

              {/* Column mapping */}
              <div className="grid grid-cols-3 gap-3">
                {(["date", "amount", "description", "counterparty", "reference", "iban"] as const).map((field) => (
                  <div key={field}>
                    <Label className="text-xs text-muted-foreground capitalize">{
                      { date: "Datum", amount: "Bedrag", description: "Omschrijving", counterparty: "Tegenpartij", reference: "Kenmerk", iban: "IBAN" }[field]
                    }</Label>
                    <Select
                      value={String(mapping[field])}
                      onValueChange={(v) => setMapping({ ...mapping, [field]: parseInt(v) })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {i}: {h.slice(0, 30)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="rounded border border-border/50 overflow-x-auto max-h-[200px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-[10px]">Datum</TableHead>
                      <TableHead className="text-[10px]">Bedrag</TableHead>
                      <TableHead className="text-[10px]">Omschrijving</TableHead>
                      <TableHead className="text-[10px]">Tegenpartij</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 5).map((row, i) => (
                      <TableRow key={i} className="border-border/50">
                        <TableCell className="text-xs">{row[mapping.date]}</TableCell>
                        <TableCell className="text-xs">{row[mapping.amount]}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{row[mapping.description]}</TableCell>
                        <TableCell className="text-xs">{row[mapping.counterparty]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button onClick={handleImport} disabled={importTx.isPending} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {importTx.isPending ? "Importeren..." : "Importeer transacties"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function parseDate(raw: string): string {
  // Try YYYYMMDD, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
  const cleaned = raw.replace(/['"]/g, "").trim();
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const dmy = cleaned.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return cleaned;
}

async function readAllRows(file: File): Promise<string[][]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.slice(1).map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if ((char === "," || char === ";") && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += char;
    }
    result.push(current.trim());
    return result;
  });
}
