import { useRef, useState, useCallback } from "react";
import { Camera, X, RotateCcw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (files: File[]) => void;
  isUploading: boolean;
}

export function ReceiptScanner({ open, onClose, onCapture, isUploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const handleCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedFile) {
      onCapture([capturedFile]);
      setPreview(null);
      setCapturedFile(null);
      onClose();
    }
  }, [capturedFile, onCapture, onClose]);

  const handleRetake = useCallback(() => {
    setPreview(null);
    setCapturedFile(null);
    // Small delay to allow state to clear before re-opening camera
    setTimeout(() => inputRef.current?.click(), 100);
  }, []);

  const handleOpenCamera = useCallback(() => {
    setPreview(null);
    setCapturedFile(null);
    inputRef.current?.click();
  }, []);

  const handleClose = useCallback(() => {
    setPreview(null);
    setCapturedFile(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Bonnetje scannen
          </DialogTitle>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCapture}
        />

        {preview ? (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
              <img
                src={preview}
                alt="Gescand bonnetje"
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetake}
                disabled={isUploading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Opnieuw
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Uploaden & scannen
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-primary/10 p-6">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Maak een foto van je bonnetje
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                De AI herkent automatisch het bedrag, de datum en leverancier
              </p>
            </div>
            <Button onClick={handleOpenCamera} size="lg">
              <Camera className="h-4 w-4 mr-2" />
              Open camera
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
