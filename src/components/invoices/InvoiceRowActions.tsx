import { useState } from "react";
import { Mail, FileCode2, Link2, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSendInvoiceEmail, useCreateInvoicePaymentLink, useInvoiceWithLines } from "@/hooks/useInvoices";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { buildInvoiceUbl, downloadUbl } from "@/lib/ublExport";

interface Invoice {
  id: string;
  invoice_number: string;
  contact_id?: string | null;
  contact_name?: string | null;
  status: string;
  invoice_type?: string;
}

export function InvoiceRowActions({ invoice }: { invoice: Invoice }) {
  const [mailOpen, setMailOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  const sendEmail = useSendInvoiceEmail();
  const createLink = useCreateInvoicePaymentLink();
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  const openMailDialog = async () => {
    setMailOpen(true);
    if (!recipient && invoice.contact_id) {
      setLoadingDefaults(true);
      const { data } = await supabase.from("contacts").select("email").eq("id", invoice.contact_id).maybeSingle();
      if (data?.email) setRecipient(data.email);
      setLoadingDefaults(false);
    }
  };

  const handleSend = async () => {
    try {
      await sendEmail.mutateAsync({
        invoice_id: invoice.id,
        recipient_email: recipient || undefined,
        message: message || undefined,
      });
      toast.success(`Factuur ${invoice.invoice_number} verzonden naar ${recipient}`);
      setMailOpen(false);
      setMessage("");
    } catch (e: any) {
      toast.error(e.message || "Versturen mislukt");
    }
  };

  const handleDownloadUbl = async () => {
    if (!orgId) return;
    const t = toast.loading("UBL genereren…");
    try {
      const [{ data: full }, { data: lines }, { data: org }, { data: contact }] = await Promise.all([
        supabase.from("invoices").select("*").eq("id", invoice.id).single(),
        supabase.from("invoice_lines").select("*").eq("invoice_id", invoice.id).order("line_number"),
        supabase.from("organizations").select("name, legal_name, kvk_number, btw_number, iban, email, phone, address_street, address_postal_code, address_city, address_country").eq("id", orgId).single(),
        invoice.contact_id
          ? supabase.from("contacts").select("name, email, btw_number, address_street, address_postal_code, address_city, address_country").eq("id", invoice.contact_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (!full || !org) throw new Error("Gegevens onvolledig");

      const xml = buildInvoiceUbl({
        invoice: {
          invoice_number: full.invoice_number,
          invoice_date: full.invoice_date,
          due_date: full.due_date,
          currency: full.currency || "EUR",
          subtotal: Number(full.subtotal),
          total_vat: Number(full.total_vat),
          total_amount: Number(full.total_amount),
          notes: full.notes,
          payment_reference: full.payment_reference,
        },
        supplier: org,
        customer: contact || { name: invoice.contact_name || "Onbekend" },
        lines: (lines || []).map((l: any) => ({
          line_number: l.line_number,
          description: l.description,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          line_total: Number(l.line_total),
          vat_amount: Number(l.vat_amount),
          vat_percentage: Number(l.vat_percentage),
          vat_rate_type: l.vat_rate_type,
        })),
      });
      downloadUbl(`UBL-${full.invoice_number}.xml`, xml);
      toast.dismiss(t);
      toast.success("UBL gedownload");
    } catch (e: any) {
      toast.dismiss(t);
      toast.error(e.message || "UBL export mislukt");
    }
  };

  const handleCreatePaymentLink = async () => {
    try {
      const res = await createLink.mutateAsync({ invoice_id: invoice.id });
      await navigator.clipboard.writeText(res.url).catch(() => {});
      toast.success(res.reused ? "Bestaande betaallink gekopieerd" : "Betaallink aangemaakt en gekopieerd");
    } catch (e: any) {
      toast.error(e.message || "Stripe is mogelijk nog niet geactiveerd");
    }
  };

  const isSales = invoice.invoice_type === "sales" || !invoice.invoice_type;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {isSales && (
            <DropdownMenuItem onClick={openMailDialog}>
              <Mail className="h-4 w-4 mr-2" /> Mailen naar klant
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDownloadUbl}>
            <FileCode2 className="h-4 w-4 mr-2" /> Download UBL
          </DropdownMenuItem>
          {isSales && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreatePaymentLink} disabled={createLink.isPending}>
                {createLink.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                Stripe-betaallink
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={mailOpen} onOpenChange={setMailOpen}>
        <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Factuur {invoice.invoice_number} mailen</DialogTitle>
            <DialogDescription>
              We sturen een nette mail met factuurgegevens, IBAN en (indien aanwezig) een directe betaallink.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Ontvanger</Label>
              <Input
                id="recipient"
                type="email"
                value={recipient}
                placeholder={loadingDefaults ? "Laden…" : "klant@bedrijf.nl"}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="msg">Persoonlijk bericht (optioneel)</Label>
              <Textarea
                id="msg"
                rows={4}
                value={message}
                placeholder="Beste klant, hierbij de factuur voor…"
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMailOpen(false)}>Annuleren</Button>
            <Button onClick={handleSend} disabled={!recipient || sendEmail.isPending}>
              {sendEmail.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Versturen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
