import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Camera } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDetail } from "@/components/documents/DocumentDetail";
import { ReceiptScanner } from "@/components/documents/ReceiptScanner";

export default function Receipts() {
  const {
    documents,
    isLoading,
    viewMode,
    setViewMode,
    uploadMutation,
    updateDocument,
    handleDrop,
    orgId,
  } = useDocuments();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Filter only receipts
  const receipts = documents.filter((d) => d.document_type === "receipt");
  const selectedDoc = receipts.find((d) => d.id === selectedDocId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bonnen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan of upload fysieke bonnetjes — alles wordt automatisch verwerkt.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setScannerOpen(true)} className="gap-2">
            <Camera className="h-4 w-4" />
            Scan bonnetje
          </Button>
        </div>
      </div>

      <DocumentUploadZone
        onDrop={handleDrop}
        isUploading={uploadMutation.isPending}
        onScanClick={() => setScannerOpen(true)}
      />

      <ReceiptScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCapture={handleDrop}
        isUploading={uploadMutation.isPending}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {receipts.length} bon{receipts.length !== 1 ? "nen" : ""}
        </p>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Laden...
        </div>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Camera className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">Geen bonnen gevonden</p>
          <p className="text-xs text-muted-foreground mt-1">
            Scan of upload je eerste bonnetje om te beginnen
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <DocumentGrid documents={receipts} onSelect={setSelectedDocId} />
      ) : (
        <DocumentList documents={receipts} onSelect={setSelectedDocId} />
      )}

      {selectedDoc && (
        <DocumentDetail
          document={selectedDoc}
          onClose={() => setSelectedDocId(null)}
          onUpdate={(updates) =>
            updateDocument.mutate({ id: selectedDoc.id, updates })
          }
          orgId={orgId}
        />
      )}
    </div>
  );
}
