import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, CheckCircle2, Inbox, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    deleteDocument,
    handleDrop,
    orgId,
  } = useDocuments();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const selectedDoc = documents.find((d) => d.id === selectedDocId) ?? null;

  const inboxDocs = documents.filter(
    (d) => !d.processing_status || d.processing_status === "inbox" || d.processing_status === "processing" || d.ocr_status === "pending" || d.ocr_status === "processing"
  );
  const processedDocs = documents.filter(
    (d) => d.processing_status === "processed"
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Documenten
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload en het systeem doet de rest — categorisering, BTW en boeking automatisch.
        </p>
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

      <Tabs defaultValue="inbox">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="inbox" className="gap-1 text-xs sm:text-sm">
              <Inbox className="h-3.5 w-3.5 hidden sm:block" />
              Inbox
              {inboxDocs.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {inboxDocs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed" className="gap-1 text-xs sm:text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 hidden sm:block" />
              Verwerkt ({processedDocs.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5 hidden sm:block" />
              Alles ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="missing" className="text-xs sm:text-sm">
              Ontbrekend ({missingDocs.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-1 self-end">
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

        <TabsContent value="inbox">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Laden...</div>
          ) : inboxDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
              <p className="text-sm font-medium text-foreground">Inbox is leeg</p>
              <p className="text-xs text-muted-foreground mt-1">Alle documenten zijn verwerkt</p>
            </div>
          ) : viewMode === "grid" ? (
            <DocumentGrid documents={inboxDocs} onSelect={setSelectedDocId} />
          ) : (
            <DocumentList documents={inboxDocs} onSelect={setSelectedDocId} />
          )}
        </TabsContent>

        <TabsContent value="processed">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Laden...</div>
          ) : viewMode === "grid" ? (
            <DocumentGrid documents={processedDocs} onSelect={setSelectedDocId} />
          ) : (
            <DocumentList documents={processedDocs} onSelect={setSelectedDocId} />
          )}
        </TabsContent>

        <TabsContent value="all">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Laden...</div>
          ) : viewMode === "grid" ? (
            <DocumentGrid documents={documents} onSelect={setSelectedDocId} />
          ) : (
            <DocumentList documents={documents} onSelect={setSelectedDocId} />
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
          onDelete={(id) => {
            deleteDocument.mutate(id);
            setSelectedDocId(null);
          }}
          orgId={orgId}
        />
      )}
    </div>
  );
}
