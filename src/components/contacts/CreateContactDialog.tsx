import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactDialog({ open, onOpenChange }: Props) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    legal_name: "",
    email: "",
    phone: "",
    btw_number: "",
    kvk_number: "",
    iban: "",
    address_street: "",
    address_postal_code: "",
    address_city: "",
    address_country: "NL",
    is_customer: true,
    is_supplier: false,
    notes: "",
  });

  const reset = () =>
    setForm({
      name: "",
      legal_name: "",
      email: "",
      phone: "",
      btw_number: "",
      kvk_number: "",
      iban: "",
      address_street: "",
      address_postal_code: "",
      address_city: "",
      address_country: "NL",
      is_customer: true,
      is_supplier: false,
      notes: "",
    });

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Geen organisatie gekozen");
      if (!form.name.trim()) throw new Error("Naam is verplicht");
      const { error } = await supabase.from("contacts").insert({
        organization_id: orgId,
        name: form.name.trim(),
        legal_name: form.legal_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        btw_number: form.btw_number.trim() || null,
        kvk_number: form.kvk_number.trim() || null,
        iban: form.iban.trim() || null,
        address_street: form.address_street.trim() || null,
        address_postal_code: form.address_postal_code.trim() || null,
        address_city: form.address_city.trim() || null,
        address_country: form.address_country.trim() || null,
        is_customer: form.is_customer,
        is_supplier: form.is_supplier,
        is_active: true,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Relatie toegevoegd");
      qc.invalidateQueries({ queryKey: ["contacts"] });
      reset();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Aanmaken mislukt"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe relatie</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Bedrijf of persoon"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legal_name">Juridische naam</Label>
            <Input
              id="legal_name"
              value={form.legal_name}
              onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefoon</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="btw">BTW-nummer</Label>
            <Input
              id="btw"
              value={form.btw_number}
              onChange={(e) => setForm({ ...form, btw_number: e.target.value })}
              placeholder="NL123456789B01"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kvk">KvK-nummer</Label>
            <div className="flex gap-2">
              <Input
                id="kvk"
                value={form.kvk_number}
                onChange={(e) => setForm({ ...form, kvk_number: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const q = form.kvk_number.trim() || form.name.trim();
                  if (!q) { toast.error("Vul KvK-nummer of naam in"); return; }
                  const { data, error } = await supabase.functions.invoke("lookup-kvk", { body: { query: q } });
                  if (error || data?.error) { toast.error(data?.hint ?? data?.error ?? error?.message ?? "KVK lookup mislukt"); return; }
                  const r = data.result;
                  if (Array.isArray(r)) { toast.info(`${r.length} resultaten — vul exact KvK-nummer in voor auto-fill`); return; }
                  setForm((f) => ({
                    ...f,
                    kvk_number: r.kvk_number ?? f.kvk_number,
                    name: f.name || r.name,
                    legal_name: r.legal_name ?? f.legal_name,
                    address_street: r.address_street ?? f.address_street,
                    address_postal_code: r.address_postal_code ?? f.address_postal_code,
                    address_city: r.address_city ?? f.address_city,
                    address_country: r.address_country ?? f.address_country,
                  }));
                  toast.success("Bedrijfsgegevens opgehaald via KVK");
                }}
              >
                KVK
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="street">Adres</Label>
            <Input
              id="street"
              value={form.address_street}
              onChange={(e) => setForm({ ...form, address_street: e.target.value })}
              placeholder="Straat en huisnummer"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zip">Postcode</Label>
            <Input
              id="zip"
              value={form.address_postal_code}
              onChange={(e) => setForm({ ...form, address_postal_code: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Plaats</Label>
            <Input
              id="city"
              value={form.address_city}
              onChange={(e) => setForm({ ...form, address_city: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">Land</Label>
            <Input
              id="country"
              value={form.address_country}
              onChange={(e) => setForm({ ...form, address_country: e.target.value })}
              placeholder="NL"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.is_customer}
                onCheckedChange={(v) => setForm({ ...form, is_customer: !!v })}
              />
              Klant
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.is_supplier}
                onCheckedChange={(v) => setForm({ ...form, is_supplier: !!v })}
              />
              Leverancier
            </label>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.name.trim()}
          >
            {create.isPending ? "Opslaan..." : "Relatie toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
