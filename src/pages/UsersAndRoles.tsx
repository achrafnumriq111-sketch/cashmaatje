import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users, Trash2, Mail } from "lucide-react";
import { pageTransition, cardVariant } from "@/lib/animations";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { ROLE_LABELS_NL as ROLE_LABELS, ROLE_DESCRIPTIONS_NL as ROLE_DESCRIPTIONS, type EntityRole } from "@/lib/roles";
import { toast } from "sonner";

type RoleRow = {
  id: string;
  user_id: string;
  organization_id: string;
  role: EntityRole;
  can_read: boolean;
  can_write: boolean;
  can_admin: boolean;
  accepted_at: string | null;
  invited_at: string;
};

const ROLE_COLOR: Record<EntityRole, string> = {
  owner: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
  admin: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  editor: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  viewer: "bg-zinc-400/10 text-zinc-400 border-zinc-400/30",
};

export default function UsersAndRoles() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { email: string; full_name: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "viewer" as EntityRole });

  async function load() {
    if (!orgId) return;
    setLoading(true);
    const { data: roles } = await supabase.from("entity_roles").select("*").eq("organization_id", orgId);
    setRows((roles ?? []) as RoleRow[]);
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("user_profiles").select("id, email, full_name").in("id", ids);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = { email: p.email, full_name: p.full_name }; });
      setProfiles(map);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [orgId]);

  async function invite() {
    if (!form.email.trim() || !orgId) return;
    try {
      const { data: prof } = await supabase.from("user_profiles").select("id").eq("email", form.email.trim().toLowerCase()).maybeSingle();
      if (!prof) {
        toast.error("Gebruiker niet gevonden. Vraag ze eerst te registreren.");
        return;
      }
      const perms = {
        owner: { can_read: true, can_write: true, can_admin: true },
        admin: { can_read: true, can_write: true, can_admin: true },
        editor: { can_read: true, can_write: true, can_admin: false },
        viewer: { can_read: true, can_write: false, can_admin: false },
      }[form.role];
      const { error } = await supabase.from("entity_roles").insert({
        organization_id: orgId,
        user_id: prof.id,
        role: form.role,
        ...perms,
        accepted_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(`${ROLE_LABELS[form.role]} toegevoegd`);
      setOpen(false);
      setForm({ email: "", role: "viewer" });
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function changeRole(row: RoleRow, role: EntityRole) {
    const perms = {
      owner: { can_read: true, can_write: true, can_admin: true },
      admin: { can_read: true, can_write: true, can_admin: true },
      editor: { can_read: true, can_write: true, can_admin: false },
      viewer: { can_read: true, can_write: false, can_admin: false },
    }[role];
    const { error } = await supabase.from("entity_roles").update({ role, ...perms }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Rol bijgewerkt");
    load();
  }

  async function revoke(id: string) {
    const { error } = await supabase.from("entity_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Toegang ingetrokken");
    load();
  }

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gebruikers & rechten</h1>
          <p className="text-sm text-muted-foreground mt-1">Beheer wie toegang heeft tot deze organisatie</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1.5"><Plus className="h-4 w-4" />Gebruiker uitnodigen</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Gebruiker uitnodigen</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>E-mailadres</Label><Input type="email" placeholder="naam@voorbeeld.nl" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div>
                <Label>Rol</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as EntityRole })}>
                  {(Object.keys(ROLE_LABELS) as EntityRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]} — {ROLE_DESCRIPTIONS[r]}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter><Button onClick={invite}>Uitnodigen</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Toegang</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Laden...</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nog geen extra gebruikers</p>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => {
                  const p = profiles[r.user_id];
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {(p?.full_name?.[0] ?? p?.email?.[0] ?? "?").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{p?.full_name || p?.email || r.user_id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{p?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={ROLE_COLOR[r.role]}>{ROLE_LABELS[r.role]}</Badge>
                        <select className="h-8 rounded-md border bg-background px-2 text-xs" value={r.role} onChange={(e) => changeRole(r, e.target.value as EntityRole)}>
                          {(Object.keys(ROLE_LABELS) as EntityRole[]).map((rr) => <option key={rr} value={rr}>{ROLE_LABELS[rr]}</option>)}
                        </select>
                        <Button size="sm" variant="ghost" onClick={() => revoke(r.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
