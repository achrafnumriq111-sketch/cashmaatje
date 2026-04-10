import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDetail } from "@/components/documents/DocumentDetail";
import { MissingDocuments } from "@/components/documents/MissingDocuments";
import { ReceiptScanner } from "@/components/documents/ReceiptScanner";

export default function Documents() {
  const {
    documents,
    missingDocs,
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
  const selectedDoc = documents.find((d) => d.id === selectedDocId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Documenten
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload en beheer facturen, bonnetjes en documenten.
          </p>
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

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">
              Alle documenten ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="missing">
              Ontbrekend ({missingDocs.length})
            </TabsTrigger>
          </TabsList>
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

        <TabsContent value="all">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Laden...
            </div>
          ) : viewMode === "grid" ? (
            <DocumentGrid
              documents={documents}
              onSelect={setSelectedDocId}
            />
          ) : (
            <DocumentList
              documents={documents}
              onSelect={setSelectedDocId}
            />
          )}
        </TabsContent>

        <TabsContent value="missing">
          <MissingDocuments transactions={missingDocs} />
        </TabsContent>
      </Tabs>

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
