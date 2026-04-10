import { useCallback, useState, useRef } from "react";
import { Upload, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onDrop: (files: File[]) => void;
  isUploading: boolean;
  onScanClick?: () => void;
}

export function DocumentUploadZone({ onDrop, isUploading, onScanClick }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onDrop(files);
    },
    [onDrop]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) onDrop(files);
      e.target.value = "";
    },
    [onDrop]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/40"
      }`}
    >
      {isUploading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <Upload className="h-8 w-8 text-muted-foreground" />
      )}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Sleep facturen en bonnetjes hierheen
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG of PDF — max 20 MB
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          Kies bestanden
        </Button>
        {onScanClick && (
          <Button
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={onScanClick}
          >
            <Camera className="h-4 w-4 mr-1" />
            Scan bonnetje
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
