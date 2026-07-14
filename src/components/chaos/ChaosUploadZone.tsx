import { useCallback, useRef, useState } from "react";
import { Upload, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChaosGroupingDialog, type GroupMode } from "./ChaosGroupingDialog";

interface Props {
  onFiles: (files: File[], mode: GroupMode) => void;
  isUploading: boolean;
}

const ACCEPT = ".jpg,.jpeg,.png,.webp,.heic,.pdf";

export function ChaosUploadZone({ onFiles, isUploading }: Props) {
  const [drag, setDrag] = useState(false);
  const [pending, setPending] = useState<File[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      if (files.length === 1) {
        // Multi-page PDF? behandel als 1 doc met page_count via edge function.
        onFiles(files, "separate");
        return;
      }
      setPending(files);
    },
    [onFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles],
  );

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-10 transition-all ${
          drag
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/40 bg-card/30"
        }`}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            ) : (
              <Upload className="h-7 w-7 text-primary" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Gooi hier alles in waar je niets mee kunt
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              Brieven van de Belastingdienst, deurwaarder, leveranciers, UWV. Foto's,
              scans, PDF's. Meerdere pagina's van dezelfde brief? Wij vragen of ze
              bij elkaar horen.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Kies bestanden
            </Button>
            <span className="text-xs text-muted-foreground">
              of sleep ze hierin — meerdere tegelijk mag
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            PDF, JPG, PNG, HEIC — geen limiet aan aantal
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            handleFiles(files);
            e.target.value = "";
          }}
        />
      </div>

      <ChaosGroupingDialog
        open={pending !== null}
        files={pending ?? []}
        onCancel={() => setPending(null)}
        onConfirm={(mode) => {
          if (pending) onFiles(pending, mode);
          setPending(null);
        }}
      />
    </>
  );
}
