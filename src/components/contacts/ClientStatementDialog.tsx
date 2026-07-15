import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { generateClientStatementPdf } from "@/lib/clientStatementPdf";
import { useOrganization } from "@/hooks/useOrganization";

interface Props {
  open: boolean;
  onClose: () => void;
  contact: { id: string; name: string; email?: string | null } | null;
}

export function ClientStatementDialog({ open, onClose, contact }: Props) {
  const { membership } = useOrganization();
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!contact || !membership?.organizationId) return;
    setBusy(true);
    try {
      const r = await generateClientStatementPdf({
        orgId: membership.organizationId,
        contactId: contact.id,
        contactName: contact.name,
        contactEmail: contact.email,
        dateFrom: from,
        dateTo: to,
      });
      if (r.invoiceCount === 0) toast.info("Geen facturen in deze periode");
      else toast.success(`Statement met ${r.invoiceCount} facturen gedownload`);
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Statement kon niet worden gegenereerd");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Klantstatement — {contact?.name}</DialogTitle>
          <DialogDescription>Genereert een overzicht van alle facturen in de gekozen periode inclusief openstaand saldo.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Van</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Tot</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Annuleer</Button>
          <Button onClick={download} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
