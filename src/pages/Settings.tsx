import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { pageTransition, cardVariant } from "@/lib/animations";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Building2, Banknote, Sparkles, FileText, Users, CreditCard,
  Lock, AlertTriangle, Loader2, Plus, Copy, Check, Trash2, Mail,
} from "lucide-react";
import { EditOrgDialog } from "@/components/layout/EditOrgDialog";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface BankAccountRow {
  id: string;
  name: string;
  iban: string;
  bic: string | null;
  bank_name: string | null;
  is_primary: boolean | null;
  is_active: boolean | null;
}

interface MemberRow {
  id: string;
  user_id: string;
  role: UserRole;
  is_owner: boolean | null;
  email?: string;
  full_name?: string;
}

const roleOptions: UserRole[] = ["entrepreneur", "bookkeeper", "accountant", "admin"];
const roleLabels: Record<UserRole, string> = {
  entrepreneur: "Ondernemer",
  bookkeeper: "Boekhouder",
  accountant: "Accountant",
  admin: "Beheerder",
};

export default function Settings() {
  const { user } = useAuth();
  const { membership, refetch } = useOrganization();
  const navigate = useNavigate();
  const isOwner = !!membership?.isOwner;
  const canManage = isOwner || membership?.role === "admin";

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Instellingen</h1>
        <p className="mt-1 text-sm text-muted-foreground">Beheer je organisatie, team en voorkeuren.</p>
      </motion.div>

      <Tabs defaultValue="bedrijf" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="bedrijf"><Building2 className="h-3.5 w-3.5 mr-1.5" />Bedrijf</TabsTrigger>
          <TabsTrigger value="bank"><Banknote className="h-3.5 w-3.5 mr-1.5" />Bankrekeningen</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles className="h-3.5 w-3.5 mr-1.5" />AI</TabsTrigger>
          <TabsTrigger value="documenten"><FileText className="h-3.5 w-3.5 mr-1.5" />Documenten</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-3.5 w-3.5 mr-1.5" />Team</TabsTrigger>
          <TabsTrigger value="abonnement"><CreditCard className="h-3.5 w-3.5 mr-1.5" />Abonnement</TabsTrigger>
          <TabsTrigger value="beveiliging"><Lock className="h-3.5 w-3.5 mr-1.5" />Beveiliging</TabsTrigger>
          {isOwner && <TabsTrigger value="danger" className="text-destructive"><AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Gevarenzone</TabsTrigger>}
        </TabsList>

        <TabsContent value="bedrijf"><CompanyTab /></TabsContent>
        <TabsContent value="bank"><BankAccountsTab canManage={canManage} /></TabsContent>
        <TabsContent value="ai"><AiTab canManage={canManage} /></TabsContent>
        <TabsContent value="documenten"><DocumentsTab canManage={canManage} /></TabsContent>
        <TabsContent value="team"><TeamTab isOwner={isOwner} canManage={canManage} /></TabsContent>
        <TabsContent value="abonnement"><SubscriptionTab /></TabsContent>
        <TabsContent value="beveiliging"><SecurityTab /></TabsContent>
        {isOwner && <TabsContent value="danger"><DangerZoneTab onDeleted={() => { refetch(); navigate("/onboarding"); }} /></TabsContent>}
      </Tabs>
    </motion.div>
  );
}

/* ----- Bedrijf ----- */
function CompanyTab() {
  const [open, setOpen] = useState(false);
  const { membership } = useOrganization();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bedrijfsgegevens</CardTitle>
        <CardDescription>Naam, KVK, BTW, adres en fiscale instellingen.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">Actieve organisatie: <span className="text-foreground font-medium">{membership?.organizationName ?? "—"}</span></div>
        <Button onClick={() => setOpen(true)}>Bedrijfsgegevens bewerken</Button>
        <EditOrgDialog open={open} onClose={() => setOpen(false)} />
      </CardContent>
    </Card>
  );
}

/* ----- Bankrekeningen ----- */
function BankAccountsTab({ canManage }: { canManage: boolean }) {
  const { membership } = useOrganization();
  const [rows, setRows] = useState<BankAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", iban: "", bic: "", bank_name: "" });

  const load = async () => {
    if (!membership) return;
    setLoading(true);
    const { data } = await supabase
      .from("bank_accounts")
      .select("id,name,iban,bic,bank_name,is_primary,is_active")
      .eq("organization_id", membership.organizationId)
      .order("is_primary", { ascending: false });
    setRows((data ?? []) as BankAccountRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [membership?.organizationId]);

  const handleAdd = async () => {
    if (!membership || !form.name || !form.iban) { toast.error("Naam en IBAN zijn verplicht"); return; }
    const { error } = await supabase.from("bank_accounts").insert({
      organization_id: membership.organizationId,
      name: form.name, iban: form.iban.replace(/\s/g, "").toUpperCase(),
      bic: form.bic || null, bank_name: form.bank_name || null,
      is_primary: rows.length === 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Bankrekening toegevoegd");
    setForm({ name: "", iban: "", bic: "", bank_name: "" });
    setAdding(false);
    load();
  };

  const toggleActive = async (row: BankAccountRow) => {
    await supabase.from("bank_accounts").update({ is_active: !row.is_active }).eq("id", row.id);
    load();
  };
  const setPrimary = async (row: BankAccountRow) => {
    if (!membership) return;
    await supabase.from("bank_accounts").update({ is_primary: false }).eq("organization_id", membership.organizationId);
    await supabase.from("bank_accounts").update({ is_primary: true }).eq("id", row.id);
    toast.success("Primaire rekening bijgewerkt");
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bankrekeningen</CardTitle>
          <CardDescription>Beheer de bankrekeningen van je organisatie.</CardDescription>
        </div>
        {canManage && !adding && <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5 mr-1" />Toevoegen</Button>}
      </CardHeader>
      <CardContent>
        {adding && (
          <div className="grid grid-cols-2 gap-3 p-3 mb-4 rounded-lg border border-border bg-muted/30">
            <div><Label className="text-xs">Naam</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">IBAN</Label><Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} /></div>
            <div><Label className="text-xs">BIC</Label><Input value={form.bic} onChange={(e) => setForm({ ...form, bic: e.target.value })} /></div>
            <div><Label className="text-xs">Bank</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
            <div className="col-span-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Annuleren</Button>
              <Button size="sm" onClick={handleAdd}>Opslaan</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nog geen bankrekeningen toegevoegd.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>IBAN</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Acties</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.name}
                    {r.is_primary && <Badge variant="secondary" className="ml-2">Primair</Badge>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.iban}</TableCell>
                  <TableCell>{r.bank_name ?? "—"}</TableCell>
                  <TableCell>{r.is_active ? <Badge>Actief</Badge> : <Badge variant="outline">Inactief</Badge>}</TableCell>
                  {canManage && (
                    <TableCell className="text-right space-x-1">
                      {!r.is_primary && r.is_active && <Button variant="ghost" size="sm" onClick={() => setPrimary(r)}>Primair</Button>}
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(r)}>{r.is_active ? "Deactiveren" : "Activeren"}</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ----- AI ----- */
function AiTab({ canManage }: { canManage: boolean }) {
  const { membership } = useOrganization();
  const [settings, setSettings] = useState({ autoCategorize: true, autoApplyThreshold: 90, language: "nl", explanationMode: "short", autoAcceptThreshold: 95 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!membership) return;
    supabase.from("organizations").select("settings").eq("id", membership.organizationId).single().then(({ data }) => {
      const s = (data?.settings as Record<string, unknown>)?.ai as typeof settings | undefined;
      if (s) setSettings({ ...settings, ...s });
      setLoading(false);
    });
    // eslint-disable-next-line
  }, [membership?.organizationId]);

  const save = async () => {
    if (!membership) return;
    setSaving(true);
    const { data: cur } = await supabase.from("organizations").select("settings").eq("id", membership.organizationId).single();
    const merged = { ...((cur?.settings as Record<string, unknown>) ?? {}), ai: settings };
    const { error } = await supabase.from("organizations").update({ settings: merged }).eq("id", membership.organizationId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("AI-instellingen opgeslagen");
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>AI-instellingen</CardTitle><CardDescription>Bepaal hoe zelfstandig de AI mag werken.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div><Label>Auto-categoriseren</Label><p className="text-xs text-muted-foreground">AI stelt categorie + grootboek voor</p></div>
          <Switch checked={settings.autoCategorize} onCheckedChange={(v) => setSettings({ ...settings, autoCategorize: v })} disabled={!canManage} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2"><Label>Auto-toepassen drempel</Label><span className="text-sm tabular-nums text-foreground">{settings.autoApplyThreshold}%</span></div>
          <Slider value={[settings.autoApplyThreshold]} onValueChange={(v) => setSettings({ ...settings, autoApplyThreshold: v[0] })} min={50} max={100} step={5} disabled={!canManage} />
          <p className="text-xs text-muted-foreground mt-1">Suggesties met confidence ≥ {settings.autoApplyThreshold}% worden direct toegepast</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2"><Label>Auto-accepteer drempel</Label><span className="text-sm tabular-nums text-foreground">{settings.autoAcceptThreshold}%</span></div>
          <Slider value={[settings.autoAcceptThreshold]} onValueChange={(v) => setSettings({ ...settings, autoAcceptThreshold: v[0] })} min={80} max={100} step={1} disabled={!canManage} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Taal</Label>
            <Select value={settings.language} onValueChange={(v) => setSettings({ ...settings, language: v })} disabled={!canManage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="nl">Nederlands</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Uitleg-modus</Label>
            <Select value={settings.explanationMode} onValueChange={(v) => setSettings({ ...settings, explanationMode: v })} disabled={!canManage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="short">Kort</SelectItem><SelectItem value="detailed">Uitgebreid</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        {canManage && <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}Opslaan</Button>}
      </CardContent>
    </Card>
  );
}

/* ----- Documenten ----- */
function DocumentsTab({ canManage }: { canManage: boolean }) {
  const { membership } = useOrganization();
  const [prefs, setPrefs] = useState({ autoOcr: true, autoCategorize: true, duplicateCheck: true, autoAttachToTransaction: true, defaultExpenseAccount: "7600" });
  const [forwardingAddr, setForwardingAddr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!membership) return;
    supabase.from("organizations").select("settings,name").eq("id", membership.organizationId).single().then(({ data }) => {
      const s = (data?.settings as Record<string, unknown>) ?? {};
      const p = s.processing as typeof prefs | undefined;
      if (p) setPrefs({ ...prefs, ...p });
      const slug = (data?.name ?? "org").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "org";
      setForwardingAddr((s.forwarding_address as string | undefined) ?? `inbox-${slug}-${membership.organizationId.slice(0, 6)}@inbox.cashmaatje.com`);
      setLoading(false);
    });
    // eslint-disable-next-line
  }, [membership?.organizationId]);

  const save = async () => {
    if (!membership) return;
    setSaving(true);
    const { data: cur } = await supabase.from("organizations").select("settings").eq("id", membership.organizationId).single();
    const merged = { ...((cur?.settings as Record<string, unknown>) ?? {}), processing: prefs, forwarding_address: forwardingAddr };
    const { error } = await supabase.from("organizations").update({ settings: merged }).eq("id", membership.organizationId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Voorkeuren opgeslagen");
  };

  const copy = () => {
    navigator.clipboard.writeText(forwardingAddr);
    setCopied(true);
    toast.success("Adres gekopieerd");
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4" />Auto-forwarding adres</CardTitle><CardDescription>Stuur facturen door naar dit adres voor automatische verwerking.</CardDescription></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input readOnly value={forwardingAddr} className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Mailbox-ingest is in beta — adres is geldig en wordt actief zodra je inbox-DNS gereed is.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Verwerkingsvoorkeuren</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            ["autoOcr", "Auto-OCR", "Documenten worden direct na upload uitgelezen"],
            ["autoCategorize", "Auto-categoriseren", "AI bepaalt categorie en grootboek"],
            ["duplicateCheck", "Duplicaat-controle", "Waarschuw bij identieke documenten"],
            ["autoAttachToTransaction", "Auto-koppelen aan transactie", "Document hangt automatisch aan matchende banktransactie"],
          ].map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <div><Label>{label}</Label><p className="text-xs text-muted-foreground">{desc}</p></div>
              <Switch checked={prefs[key as keyof typeof prefs] as boolean} onCheckedChange={(v) => setPrefs({ ...prefs, [key]: v })} disabled={!canManage} />
            </div>
          ))}
          <div>
            <Label>Standaard kostengrootboek</Label>
            <Input value={prefs.defaultExpenseAccount} onChange={(e) => setPrefs({ ...prefs, defaultExpenseAccount: e.target.value })} disabled={!canManage} />
          </div>
          {canManage && <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}Opslaan</Button>}
        </CardContent>
      </Card>
    </div>
  );
}

/* ----- Team ----- */
function TeamTab({ isOwner, canManage }: { isOwner: boolean; canManage: boolean }) {
  const { membership, refetch } = useOrganization();
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("entrepreneur");

  const load = async () => {
    if (!membership) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("organization_members")
      .select("id, user_id, role, is_owner")
      .eq("organization_id", membership.organizationId);

    const enriched: MemberRow[] = [];
    for (const r of rows ?? []) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("email, full_name")
        .eq("id", r.user_id)
        .maybeSingle();
      enriched.push({ ...r, email: profile?.email ?? "—", full_name: profile?.full_name ?? "" });
    }
    setMembers(enriched);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [membership?.organizationId]);

  const invite = async () => {
    if (!membership || !inviteEmail) return;
    const { data: profile } = await supabase.from("user_profiles").select("id").eq("email", inviteEmail).maybeSingle();
    if (!profile) { toast.error("Gebruiker niet gevonden. Vraag ze eerst een account aan te maken."); return; }
    const { error } = await supabase.from("organization_members").insert({
      organization_id: membership.organizationId,
      user_id: profile.id,
      role: inviteRole,
      accepted_at: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Lid toegevoegd");
    setInviteEmail("");
    load();
  };

  const changeRole = async (m: MemberRow, role: UserRole) => {
    await supabase.from("organization_members").update({ role }).eq("id", m.id);
    toast.success("Rol bijgewerkt");
    load();
  };

  const remove = async (m: MemberRow) => {
    await supabase.from("organization_members").delete().eq("id", m.id);
    toast.success("Lid verwijderd");
    load();
    refetch();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Team & rollen</CardTitle><CardDescription>Beheer wie toegang heeft tot deze organisatie.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {canManage && (
          <div className="grid grid-cols-[1fr_180px_auto] gap-2 p-3 rounded-lg border border-border bg-muted/30">
            <Input placeholder="email@voorbeeld.nl" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" />
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roleOptions.map((r) => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={invite} disabled={!inviteEmail}><Plus className="h-3.5 w-3.5 mr-1" />Toevoegen</Button>
          </div>
        )}
        {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Naam</TableHead><TableHead>E-mail</TableHead><TableHead>Rol</TableHead><TableHead className="text-right">Acties</TableHead></TableRow></TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name || "—"} {m.is_owner && <Badge variant="secondary" className="ml-2">Eigenaar</Badge>}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    {canManage && !m.is_owner ? (
                      <Select value={m.role} onValueChange={(v) => changeRole(m, v as UserRole)}>
                        <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{roleOptions.map((r) => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : <Badge variant="outline">{roleLabels[m.role]}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && !m.is_owner && m.user_id !== user?.id && (
                      <Button variant="ghost" size="sm" onClick={() => remove(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ----- Abonnement ----- */
function SubscriptionTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-portal-session");
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data?.url) window.location.href = data.url;
  };

  return (
    <Card>
      <CardHeader><CardTitle>Abonnement</CardTitle><CardDescription>Beheer je plan en facturen.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={openPortal} disabled={loading}>{loading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}Beheer abonnement</Button>
      </CardContent>
    </Card>
  );
}

/* ----- Beveiliging ----- */
function SecurityTab() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async () => {
    if (pwd.length < 8) { toast.error("Minimaal 8 tekens"); return; }
    if (pwd !== pwd2) { toast.error("Wachtwoorden komen niet overeen"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Wachtwoord bijgewerkt");
    setPwd(""); setPwd2("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Twee-factor authenticatie</CardTitle><CardDescription>Extra beveiliging voor je account.</CardDescription></CardHeader>
        <CardContent><Button onClick={() => navigate("/2fa/setup")}>2FA beheren</Button></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Wachtwoord wijzigen</CardTitle></CardHeader>
        <CardContent className="space-y-3 max-w-md">
          <div><Label>Nieuw wachtwoord</Label><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
          <div><Label>Bevestig wachtwoord</Label><Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} /></div>
          <Button onClick={change} disabled={busy || !pwd}>{busy && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}Wijzig wachtwoord</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----- Gevarenzone ----- */
function DangerZoneTab({ onDeleted }: { onDeleted: () => void }) {
  const { membership } = useOrganization();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!membership || confirmText !== membership.organizationName) return;
    setBusy(true);
    const { error } = await supabase.from("organizations").delete().eq("id", membership.organizationId);
    setBusy(false);
    if (error) { toast.error("Verwijderen mislukt: " + error.message); return; }
    toast.success("Organisatie verwijderd");
    onDeleted();
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader><CardTitle className="text-destructive">Gevarenzone</CardTitle><CardDescription>Onomkeerbare acties.</CardDescription></CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="h-3.5 w-3.5 mr-1" />Organisatie verwijderen</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
              <AlertDialogDescription>
                Dit verwijdert <span className="font-semibold">{membership?.organizationName}</span> en alle gekoppelde gegevens permanent.
                Typ de bedrijfsnaam om te bevestigen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={membership?.organizationName} />
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy || confirmText !== membership?.organizationName}
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Definitief verwijderen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
