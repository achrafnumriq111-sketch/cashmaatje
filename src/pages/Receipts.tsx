import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Camera } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDetail } from "@/components/documents/DocumentDetail";
import { ReceiptScanner } from "@/components/documents/ReceiptScanner";
import { pageTransition, cardVariant } from "@/lib/animations";

export default function Receipts() {
  const { documents, isLoading, viewMode, setViewMode, uploadMutation, updateDocument, deleteDocument, handleDrop, orgId } = useDocuments();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const receipts = documents.filter((d) => d.document_type === "receipt");
  const selectedDoc = receipts.find((d) => d.id === selectedDocId) ?? null;

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-4 sm:space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Bonnen</h1>
          <p className="text-sm text-muted-foreground mt-1">Scan of upload fysieke bonnetjes — alles wordt automatisch verwerkt.</p>
        </div>
        <Button onClick={() => setScannerOpen(true)} className="gap-2 w-full sm:w-auto"><Camera className="h-4 w-4" />Scan bonnetje</Button>
      </motion.div>

      <motion.div variants={cardVariant}><DocumentUploadZone onDrop={handleDrop} isUploading={uploadMutation.isPending} onScanClick={() => setScannerOpen(true)} /></motion.div>
      <ReceiptScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onCapture={handleDrop} isUploading={uploadMutation.isPending} />

      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{receipts.length} bon{receipts.length !== 1 ? "nen" : ""}</p>
        <div className="flex gap-1">
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Laden...</div>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Camera className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">Geen bonnen gevonden</p>
          <p className="text-xs text-muted-foreground mt-1">Scan of upload je eerste bonnetje om te beginnen</p>
        </div>
      ) : viewMode === "grid" ? (
        <DocumentGrid documents={receipts} onSelect={setSelectedDocId} />
      ) : (
        <DocumentList documents={receipts} onSelect={setSelectedDocId} />
      )}

      {selectedDoc && (
        <DocumentDetail document={selectedDoc} onClose={() => setSelectedDocId(null)}
          onUpdate={(updates) => updateDocument.mutate({ id: selectedDoc.id, updates })}
          onDelete={(id) => { deleteDocument.mutate(id); setSelectedDocId(null); }} orgId={orgId} />
      )}
    </motion.div>
  );
}
