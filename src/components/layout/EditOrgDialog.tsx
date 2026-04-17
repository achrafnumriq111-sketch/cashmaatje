import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface OrgData {
  name: string;
  legal_name: string | null;
  kvk_number: string | null;
  btw_number: string | null;
  iban: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_street: string | null;
  address_postal_code: string | null;
  address_city: string | null;
  org_type: string;
  vat_frequency: string;
  vat_scheme: string;
}

const empty: OrgData = {
  name: "", legal_name: "", kvk_number: "", btw_number: "", iban: "",
  email: "", phone: "", website: "",
  address_street: "", address_postal_code: "", address_city: "",
  org_type: "eenmanszaak", vat_frequency: "quarterly", vat_scheme: "standard",
};

export function EditOrgDialog({ open, onClose }: Props) {
  const { membership, refetch } = useOrganization();
  const [data, setData] = useState<OrgData>(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !membership) return;
    setLoading(true);
    supabase
      .from("organizations")
      .select("name, legal_name, kvk_number, btw_number, iban, email, phone, website, address_street, address_postal_code, address_city, org_type, vat_frequency, vat_scheme")
      .eq("id", membership.organizationId)
      .single()
      .then(({ data: row, error }) => {
        if (error) { toast.error("Kon bedrijfsgegevens niet laden"); }
        else if (row) setData({ ...empty, ...row } as OrgData);
        setLoading(false);
      });
  }, [open, membership]);

  const upd = (k: keyof OrgData, v: string) => setData((d) => ({ ...d, [k]: v }));

  const handleSave = async () => {
    if (!membership) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: data.name,
        legal_name: data.legal_name,
        kvk_number: data.kvk_number,
        btw_number: data.btw_number,
        iban: data.iban,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address_street: data.address_street,
        address_postal_code: data.address_postal_code,
        address_city: data.address_city,
        org_type: data.org_type as never,
        vat_frequency: data.vat_frequency as never,
        vat_scheme: data.vat_scheme as never,
      })
      .eq("id", membership.organizationId);
    setSaving(false);
    if (error) { toast.error("Opslaan mislukt: " + error.message); return; }
    toast.success("Bedrijfsgegevens opgeslagen");
    await refetch();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bedrijfsgegevens bewerken</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label className="text-xs">Handelsnaam</Label>
              <Input value={data.name} onChange={(e) => upd("name", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Juridische naam</Label>
              <Input value={data.legal_name ?? ""} onChange={(e) => upd("legal_name", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Rechtsvorm</Label>
              <Select value={data.org_type} onValueChange={(v) => upd("org_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="eenmanszaak">Eenmanszaak</SelectItem>
                  <SelectItem value="vof">VOF</SelectItem>
                  <SelectItem value="bv">BV</SelectItem>
                  <SelectItem value="nv">NV</SelectItem>
                  <SelectItem value="stichting">Stichting</SelectItem>
                  <SelectItem value="vereniging">Vereniging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">KvK nummer</Label>
              <Input value={data.kvk_number ?? ""} onChange={(e) => upd("kvk_number", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">BTW nummer</Label>
              <Input value={data.btw_number ?? ""} onChange={(e) => upd("btw_number", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">IBAN</Label>
              <Input value={data.iban ?? ""} onChange={(e) => upd("iban", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">BTW-aangifte frequentie</Label>
              <Select value={data.vat_frequency} onValueChange={(v) => upd("vat_frequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Maandelijks</SelectItem>
                  <SelectItem value="quarterly">Kwartaal</SelectItem>
                  <SelectItem value="yearly">Jaarlijks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">BTW regeling</Label>
              <Select value={data.vat_scheme} onValueChange={(v) => upd("vat_scheme", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standaard</SelectItem>
                  <SelectItem value="kor">KOR (kleineondernemersregeling)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={data.email ?? ""} onChange={(e) => upd("email", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Telefoon</Label>
              <Input value={data.phone ?? ""} onChange={(e) => upd("phone", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Website</Label>
              <Input value={data.website ?? ""} onChange={(e) => upd("website", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Straat + huisnummer</Label>
              <Input value={data.address_street ?? ""} onChange={(e) => upd("address_street", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Postcode</Label>
              <Input value={data.address_postal_code ?? ""} onChange={(e) => upd("address_postal_code", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Plaats</Label>
              <Input value={data.address_city ?? ""} onChange={(e) => upd("address_city", e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuleren</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
