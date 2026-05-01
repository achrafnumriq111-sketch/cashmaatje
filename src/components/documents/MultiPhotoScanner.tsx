import { useRef, useState, useCallback } from "react";
import { Camera, X, Plus, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (files: File[]) => void;
  isUploading: boolean;
}

interface Shot {
  id: string;
  file: File;
  preview: string;
}

/**
 * Multi-photo receipt scanner.
 * Capture meerdere bonnetjes achter elkaar in dezelfde sessie en upload ze als batch.
 * Elke foto wordt apart als document opgeslagen en door de OCR-pipeline gestuurd.
 */
export function MultiPhotoScanner({ open, onClose, onCapture, isUploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);

  const handleAddShot = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newShots = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setShots((prev) => [...prev, ...newShots]);
    e.target.value = "";
  }, []);

  const removeShot = useCallback((id: string) => {
    setShots((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const handleClose = useCallback(() => {
    shots.forEach((s) => URL.revokeObjectURL(s.preview));
    setShots([]);
    onClose();
  }, [shots, onClose]);

  const handleConfirm = useCallback(() => {
    if (!shots.length) return;
    onCapture(shots.map((s) => s.file));
    shots.forEach((s) => URL.revokeObjectURL(s.preview));
    setShots([]);
    onClose();
  }, [shots, onCapture, onClose]);

  const openCamera = () => inputRef.current?.click();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Bonnetjes scannen
          </DialogTitle>
          <DialogDescription>
            Maak één voor één foto's. Wanneer je klaar bent, uploaden we ze allemaal tegelijk en herkent de AI bedragen, datums en leveranciers.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleAddShot}
        />

        {shots.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-primary/10 p-6">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Maak foto's van je bonnetjes
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Voeg er zoveel toe als je wilt — alles wordt automatisch geboekt
              </p>
            </div>
            <Button onClick={openCamera} size="lg">
              <Camera className="h-4 w-4 mr-2" />
              Open camera
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto">
              <AnimatePresence>
                {shots.map((shot, idx) => (
                  <motion.div
                    key={shot.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                  >
                    <img
                      src={shot.preview}
                      alt={`Bonnetje ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                      {idx + 1}
                    </div>
                    <button
                      onClick={() => removeShot(shot.id)}
                      disabled={isUploading}
                      className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-30"
                      aria-label="Verwijder"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.button
                layout
                onClick={openCamera}
                disabled={isUploading}
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary disabled:opacity-50"
              >
                <Plus className="h-6 w-6" />
                <span className="text-[10px] font-medium">Nog één</span>
              </motion.button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Annuleer
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isUploading || !shots.length}
                className="flex-[2]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verwerken {shots.length} {shots.length === 1 ? "bonnetje" : "bonnetjes"}…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Upload {shots.length} {shots.length === 1 ? "bonnetje" : "bonnetjes"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
