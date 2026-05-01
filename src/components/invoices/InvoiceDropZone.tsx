import { useState, useCallback } from "react";
import { Upload, CheckCircle2, Loader2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useCreateInvoice, VAT_PERCENTAGES } from "@/hooks/useInvoices";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type FileStatus = "uploading" | "ocr" | "saving" | "done" | "error";

interface FileEntry {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  error?: string;
}

interface Props {
  /** Sales = quick stub invoice (manual edit later); Purchase = full OCR pipeline. */
  mode: "sales" | "purchase";
  className?: string;
  /** Optional callback after a file is fully processed. */
  onProcessed?: () => void;
}

export function InvoiceDropZone({ mode, className, onProcessed }: Props) {
  const { membership } = useOrganization();
  const createInvoice = useCreateInvoice();
  const qc = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);

  const update = (id: string, patch: Partial<FileEntry>) =>
    setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const remove = (id: string) => setFiles((fs) => fs.filter((f) => f.id !== id));

  const processPurchase = useCallback(
    async (file: File, id: string) => {
      const orgId = membership?.organizationId;
      if (!orgId) throw new Error("Geen organisatie geselecteerd");

      const now = new Date();
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = `${orgId}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${safeName}`;

      update(id, { status: "uploading", progress: 20 });
      const { error: upErr } = await supabase.storage.from("documents").upload(filePath, file, { contentType: file.type });
      if (upErr) throw upErr;

      update(id, { progress: 50 });
      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .insert({
          organization_id: orgId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          document_type: "invoice",
          ocr_status: "pending",
        })
        .select()
        .single();
      if (docErr || !doc) throw docErr ?? new Error("Document niet aangemaakt");

      update(id, { status: "ocr", progress: 70 });
      const { error: ocrErr } = await supabase.functions.invoke("process-invoice-ocr", {
        body: { document_id: doc.id, file_path: filePath, organization_id: orgId },
      });
      if (ocrErr) throw ocrErr;

      update(id, { status: "saving", progress: 90 });
      const { data: processed } = await supabase.from("documents").select("*").eq("id", doc.id).single();
      if (!processed) throw new Error("Document niet gevonden");

      const total = Number(processed.extracted_amount ?? 0);
      const vat = Number(processed.extracted_vat_amount ?? 0);
      const sub = total > 0 ? Math.max(total - vat, 0) : 0;
      const supplier = processed.extracted_supplier_name ?? file.name.replace(/\.[^/.]+$/, "");
      const invDate = processed.extracted_date ?? new Date().toISOString().split("T")[0];
      const due = new Date(invDate); due.setDate(due.getDate() + 30);

      await createInvoice.mutateAsync({
        contact_id: processed.contact_id ?? null,
        contact_name: supplier,
        invoice_date: invDate,
        due_date: due.toISOString().split("T")[0],
        invoice_type: "purchase",
        notes: `Auto-import: ${file.name}`,
        lines: [{
          description: `Inkoopfactuur ${processed.extracted_invoice_number ?? ""}`.trim(),
          quantity: 1,
          unit_price: sub > 0 ? sub : total,
          vat_rate_type: (processed.vat_rate_type_detected as any) ?? "high",
          vat_percentage: VAT_PERCENTAGES[(processed.vat_rate_type_detected as string) ?? "high"] ?? 21,
        }],
        status: "draft",
      });
    },
    [membership, createInvoice]
  );

  const processSales = useCallback(
    async (file: File, id: string) => {
      const orgId = membership?.organizationId;
      if (!orgId) throw new Error("Geen organisatie geselecteerd");

      update(id, { status: "uploading", progress: 30 });
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = `${orgId}/sales/${safeName}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(filePath, file, { contentType: file.type });
      if (upErr) throw upErr;

      update(id, { progress: 70 });
      await supabase.from("documents").insert({
        organization_id: orgId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        document_type: "invoice",
        ocr_status: "pending",
      });

      update(id, { status: "saving", progress: 95 });
    },
    [membership]
  );

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || !list.length) return;
      const accepted = Array.from(list).filter((f) => /\.(pdf|png|jpe?g)$/i.test(f.name));
      if (!accepted.length) {
        toast.error("Alleen PDF, JPG en PNG worden ondersteund");
        return;
      }

      accepted.forEach(async (file) => {
        const id = crypto.randomUUID();
        setFiles((fs) => [...fs, { id, name: file.name, size: file.size, status: "uploading", progress: 5 }]);
        try {
          if (mode === "purchase") await processPurchase(file, id);
          else await processSales(file, id);
          update(id, { status: "done", progress: 100 });
          toast.success(`${file.name} verwerkt`);
          onProcessed?.();
          qc.invalidateQueries({ queryKey: ["invoices"] });
          qc.invalidateQueries({ queryKey: ["documents"] });
        } catch (err: any) {
          console.error(err);
          update(id, { status: "error", error: err?.message || "Verwerking mislukt", progress: 100 });
          toast.error(`${file.name}: ${err?.message || "mislukt"}`);
        }
      });
    },
    [mode, processPurchase, processSales, onProcessed, qc]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const isWorking = files.some((f) => f.status === "uploading" || f.status === "ocr" || f.status === "saving");

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all p-6 text-center",
          dragging
            ? "border-primary bg-primary/5 scale-[1.005]"
            : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
        )}
      >
        <div className="flex items-center justify-center gap-4">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
            dragging ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">
              {dragging ? "Laat los om te uploaden" : "Sleep facturen hierheen"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Of <label className="text-primary cursor-pointer hover:underline">
                kies bestanden
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label> · PDF, JPG, PNG · max 20MB
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="shrink-0">
                {f.status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : f.status === "error" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{f.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {f.status === "uploading" && "Uploaden…"}
                    {f.status === "ocr" && "OCR…"}
                    {f.status === "saving" && "Opslaan…"}
                    {f.status === "done" && "Klaar"}
                    {f.status === "error" && (f.error ?? "Fout")}
                  </span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      f.status === "error" ? "bg-destructive" : f.status === "done" ? "bg-primary" : "bg-foreground/50"
                    )}
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              </div>
              {(f.status === "done" || f.status === "error") && (
                <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {!isWorking && files.length > 0 && (
            <div className="px-4 py-2 bg-muted/30">
              <button
                onClick={() => setFiles([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Lijst wissen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
