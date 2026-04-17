import { useState, useRef, useEffect } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Lightweight barcode capture using the device camera input.
 * For full BarcodeDetector support we'd need https + secure context.
 * Here: we open the camera, let the user snap or type the code, then look up the product.
 */
export function BarcodeScannerDialog({ open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const { products, adjustStock } = useProducts();

  useEffect(() => {
    if (!open) {
      setCode("");
      setScanning(false);
    }
  }, [open]);

  const lookup = () => {
    if (!code.trim()) return;
    const match = products.find(
      (p) => p.barcode === code.trim() || p.sku.toLowerCase() === code.trim().toLowerCase()
    );
    if (!match) {
      toast.error(`Geen product gevonden voor "${code}"`);
      return;
    }
    toast.success(`${match.name} gevonden — voorraad: ${match.current_stock}`);
    return match;
  };

  const handleStockIn = async () => {
    const match = lookup();
    if (!match) return;
    await adjustStock.mutateAsync({ productId: match.id, quantity: 1, notes: "Scan: +1" });
    setCode("");
  };

  const handleStockOut = async () => {
    const match = lookup();
    if (!match) return;
    await adjustStock.mutateAsync({ productId: match.id, quantity: -1, notes: "Scan: -1" });
    setCode("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Barcode scannen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
            <Camera className="h-10 w-10 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Scan met camera of voer code handmatig in
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={() => toast.info("Foto vastgelegd — voer de barcode in om door te gaan")}
            />
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Camera className="h-4 w-4 mr-2" /> Open camera
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              autoFocus
              placeholder="Barcode of SKU"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStockIn()}
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleStockIn} disabled={!code}>+1 In voorraad</Button>
              <Button variant="outline" className="flex-1" onClick={handleStockOut} disabled={!code}>−1 Uit voorraad</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
