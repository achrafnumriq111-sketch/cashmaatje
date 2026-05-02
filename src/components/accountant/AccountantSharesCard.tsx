import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Mail, Copy, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Share = {
  id: string;
  invited_email: string;
  invited_name: string | null;
  share_token: string;
  status: string;
  expires_at: string | null;
  created_at: string;
};

export function AccountantSharesCard() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [shares, setShares] = useState<Share[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ invited_email: "", invited_name: "", expires_in_days: 90 });

  async function load() {
    if (!orgId) return;
    const { data } = await supabase.from("accountant_shares").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
    setShares((data ?? []) as Share[]);
  }
  useEffect(() => { load(); }, [orgId]);

  async function invite() {
    if (!orgId || !form.invited_email.trim()) return;
    const expires_at = form.expires_in_days > 0
      ? new Date(Date.now() + form.expires_in_days * 86400000).toISOString()
      : null;
    const { error } = await supabase.from("accountant_shares").insert({
      organization_id: orgId,
      invited_email: form.invited_email.trim().toLowerCase(),
      invited_name: form.invited_name.trim() || null,
      expires_at,
      status: "pending",
    });
    if (error) return toast.error(error.message);
    toast.success("Uitnodiging aangemaakt — kopieer en verstuur de link");
    setOpen(false);
    setForm({ invited_email: "", invited_name: "", expires_in_days: 90 });
    load();
  }

  async function revoke(id: string) {
    const { error } = await supabase.from("accountant_shares").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Toegang ingetrokken");
    load();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/accountant?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link gekopieerd");
  }

  return (
    <Card className="arcory-glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Accountant-toegang</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Uitnodigen</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Accountant uitnodigen</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>E-mailadres</Label><Input type="email" value={form.invited_email} onChange={(e) => setForm({ ...form, invited_email: e.target.value })} /></div>
              <div><Label>Naam (optioneel)</Label><Input value={form.invited_name} onChange={(e) => setForm({ ...form, invited_name: e.target.value })} /></div>
              <div><Label>Geldig (dagen, 0 = onbeperkt)</Label><Input type="number" value={form.expires_in_days} onChange={(e) => setForm({ ...form, expires_in_days: parseInt(e.target.value) || 0 })} /></div>
              <p className="text-xs text-muted-foreground">De accountant krijgt alleen lees+download-toegang tot rapporten en exports.</p>
            </div>
            <DialogFooter><Button onClick={invite}>Uitnodiging maken</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {shares.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Geen actieve uitnodigingen</p>
        ) : (
          <div className="space-y-2">
            {shares.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{s.invited_name || s.invited_email}</span>
                    <Badge className={
                      s.status === "active" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30" :
                      s.status === "revoked" ? "bg-red-400/10 text-red-400 border-red-400/30" :
                      "bg-amber-400/10 text-amber-400 border-amber-400/30"
                    }>{s.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.invited_email}{s.expires_at && ` · verloopt ${new Date(s.expires_at).toLocaleDateString("nl-NL")}`}
                  </p>
                </div>
                {s.status !== "revoked" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copyLink(s.share_token)}><Copy className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => revoke(s.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
