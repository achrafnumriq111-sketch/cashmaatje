import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, CreditCard, Megaphone, MessageSquare, Loader2, Send, Plus, Search, Building2, Flag, Sparkles, Beaker, Shield, ToggleRight, UserPlus, MessageCircle, Copy, LayoutDashboard, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformRole } from "@/hooks/usePlatformRole";
import { useSupportThreads, useSupportMessages } from "@/hooks/useMessaging";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Admin() {
  const { data: role, isLoading } = usePlatformRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!role?.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Admin paneel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Beheer gebruikers, abonnementen en communicatie
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5 self-start">
          <Link to="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Naar mijn account
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="users">
        <div className="-mx-4 md:mx-0 overflow-x-auto scrollbar-none">
          <TabsList className="flex w-max md:w-full md:flex-wrap h-auto px-4 md:px-0 gap-1">
            <TabsTrigger value="users" className="gap-1.5 text-xs md:text-sm whitespace-nowrap">
              <Users className="h-3.5 w-3.5" /> Gebruikers
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-1.5 text-xs md:text-sm whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5" /> Organisaties
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-1.5 text-xs md:text-sm whitespace-nowrap">
              <Flag className="h-3.5 w-3.5" /> Flags
            </TabsTrigger>
            <TabsTrigger value="releases" className="gap-1.5 text-xs md:text-sm whitespace-nowrap">
              <Sparkles className="h-3.5 w-3.5" /> Releases
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5 text-xs md:text-sm whitespace-nowrap">
              <CreditCard className="h-3.5 w-3.5" /> Abonnementen
            </TabsTrigger>
            <TabsTrigger value="broadcasts" className="gap-1.5 text-xs md:text-sm whitespace-nowrap">
              <Megaphone className="h-3.5 w-3.5" /> Aankondigingen
            </TabsTrigger>
            <TabsTrigger value="testers" className="gap-1.5 text-xs md:text-sm whitespace-nowrap">
              <UserPlus className="h-3.5 w-3.5" /> Testers
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1.5 text-xs md:text-sm whitespace-nowrap">
              <MessageCircle className="h-3.5 w-3.5" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-1.5 text-xs md:text-sm whitespace-nowrap">
              <MessageSquare className="h-3.5 w-3.5" /> Support
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="mt-4">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="organizations" className="mt-4">
          <OrganizationsPanel />
        </TabsContent>
        <TabsContent value="flags" className="mt-4">
          <FeatureFlagsPanel />
        </TabsContent>
        <TabsContent value="releases" className="mt-4">
          <ReleasesPanel />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-4">
          <SubscriptionsPanel />
        </TabsContent>
        <TabsContent value="broadcasts" className="mt-4">
          <BroadcastsPanel />
        </TabsContent>
        <TabsContent value="testers" className="mt-4">
          <TestersPanel />
        </TabsContent>
        <TabsContent value="feedback" className="mt-4">
          <FeedbackPanel />
        </TabsContent>
        <TabsContent value="support" className="mt-4">
          <SupportPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersPanel() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter(
    (u) =>
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op email of naam..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-sm"
          />
          <Badge variant="outline" className="ml-auto">{filtered.length}</Badge>
        </div>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Aangemeld</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground break-all">{u.email}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                      {u.created_at ? format(new Date(u.created_at), "d MMM yyyy", { locale: nl }) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = (data ?? []).reduce(
    (acc, s: any) => {
      if (["active", "trialing"].includes(s.status)) acc.active++;
      if (s.status === "canceled") acc.canceled++;
      if (s.status === "past_due") acc.pastDue++;
      return acc;
    },
    { active: 0, canceled: 0, pastDue: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <StatCard label="Actief" value={stats.active} tone="primary" />
        <StatCard label="Achterstallig" value={stats.pastDue} tone="warning" />
        <StatCard label="Geannuleerd" value={stats.canceled} tone="muted" />
      </div>
      <Card>
        <CardContent className="p-4 md:p-5">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Env</TableHead>
                    <TableHead className="hidden md:table-cell">Periode tot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.user_id?.slice(0, 8)}...</TableCell>
                      <TableCell className="hidden sm:table-cell capitalize">{s.price_id ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            s.status === "active" && "border-primary/40 text-primary",
                            s.status === "past_due" && "border-yellow-500/40 text-yellow-200",
                            s.status === "canceled" && "border-muted text-muted-foreground"
                          )}
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{s.environment}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {s.current_period_end
                          ? format(new Date(s.current_period_end), "d MMM yyyy", { locale: nl })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "primary" | "warning" | "muted" }) {
  return (
    <Card>
      <CardContent className="p-3 md:p-5">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p
          className={cn(
            "text-2xl md:text-3xl font-bold",
            tone === "primary" && "text-primary",
            tone === "warning" && "text-yellow-200",
            tone === "muted" && "text-foreground"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function BroadcastsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    kind: "info" as "info" | "warning" | "success" | "announcement",
    audience: "all" as "all" | "plan_start" | "plan_smart" | "plan_pro" | "no_subscription",
    cta_label: "",
    cta_url: "",
    show_as_banner: false,
  });

  const { data: list, isLoading } = useQuery({
    queryKey: ["admin_broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        body: form.body,
        kind: form.kind,
        audience: form.audience,
        cta_label: form.cta_label || null,
        cta_url: form.cta_url || null,
        show_as_banner: form.show_as_banner,
      };
      const { error } = await supabase.from("broadcasts").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aankondiging verstuurd");
      qc.invalidateQueries({ queryKey: ["admin_broadcasts"] });
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
      setOpen(false);
      setForm({
        title: "",
        body: "",
        kind: "info",
        audience: "all",
        cta_label: "",
        cta_url: "",
        show_as_banner: false,
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nieuwe aankondiging
        </Button>
      </div>
      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="space-y-3">
              {(list ?? []).map((b: any) => (
                <div key={b.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{b.kind}</Badge>
                    <Badge variant="outline" className="text-[10px]">{b.audience}</Badge>
                    {b.show_as_banner && <Badge className="text-[10px]">Banner</Badge>}
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true, locale: nl })}
                    </span>
                  </div>
                  <h4 className="font-semibold text-foreground">{b.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{b.body}</p>
                </div>
              ))}
              {(list ?? []).length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-8">Nog geen aankondigingen</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nieuwe aankondiging</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Titel"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Textarea
              placeholder="Bericht..."
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.kind} onValueChange={(v: any) => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Waarschuwing</SelectItem>
                  <SelectItem value="success">Succes</SelectItem>
                  <SelectItem value="announcement">Aankondiging</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.audience} onValueChange={(v: any) => setForm({ ...form, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Iedereen</SelectItem>
                  <SelectItem value="no_subscription">Zonder abonnement</SelectItem>
                  <SelectItem value="plan_start">Start plan</SelectItem>
                  <SelectItem value="plan_smart">Smart plan</SelectItem>
                  <SelectItem value="plan_pro">Pro plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="CTA label (optioneel)"
                value={form.cta_label}
                onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
              />
              <Input
                placeholder="CTA URL (optioneel)"
                value={form.cta_url}
                onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={form.show_as_banner}
                onCheckedChange={(v) => setForm({ ...form, show_as_banner: !!v })}
              />
              Tonen als sitewide banner
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button
              disabled={!form.title.trim() || !form.body.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              Verstuur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupportPanel() {
  const { user } = useAuth();
  const { threads, isLoading } = useSupportThreads(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { messages, sendMessage } = useSupportMessages(activeId);
  const [text, setText] = useState("");

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4">
      <Card>
        <CardContent className="p-3 space-y-2 max-h-[40vh] md:max-h-[70vh] overflow-auto">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all",
                activeId === t.id
                  ? "bg-primary/10 border-primary/30"
                  : "border-border hover:border-primary/20 bg-card"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground truncate">{t.subject}</span>
                {t.unread_for_admin && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <Badge variant="outline" className="text-[9px]">{t.status}</Badge>
                <span>{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true, locale: nl })}</span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">{t.user_id.slice(0, 12)}...</p>
            </button>
          ))}
          {!isLoading && threads.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-6">Geen support threads</p>
          )}
        </CardContent>
      </Card>

      <Card className="h-[60vh] md:h-[70vh] flex flex-col">
        {activeId ? (
          <>
            <CardContent className="flex-1 overflow-auto p-5 space-y-3">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <div className="text-[10px] opacity-60 mt-1">
                        {format(new Date(m.created_at), "d MMM HH:mm", { locale: nl })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Antwoord als Cashmaatje team..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && text.trim()) {
                    e.preventDefault();
                    sendMessage.mutate(text);
                    setText("");
                  }
                }}
              />
              <Button
                size="icon"
                disabled={!text.trim() || sendMessage.isPending}
                onClick={() => {
                  sendMessage.mutate(text);
                  setText("");
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Selecteer een thread om te reageren
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// Organizations panel — view/manage all customer orgs, mark internal sandboxes
// ============================================================================
function OrganizationsPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["admin_orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, legal_name, kvk_number, btw_number, email, is_internal_test_org, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: memberCounts } = useQuery({
    queryKey: ["admin_org_member_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id")
        .limit(5000);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((m: any) => {
        counts[m.organization_id] = (counts[m.organization_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  const { data: owners } = useQuery({
    queryKey: ["admin_org_owners", (orgs ?? []).map((o: any) => o.id).join(",")],
    enabled: !!orgs && orgs.length > 0,
    queryFn: async () => {
      const ids = (orgs ?? []).map((o: any) => o.id);
      const { data, error } = await supabase.functions.invoke("admin-tester-ops", {
        body: { action: "list_org_owners", organization_ids: ids },
      });
      if (error) throw error;
      return (data as any).owners as Record<string, { email: string | null; full_name: string | null }>;
    },
  });

  const toggleTestOrg = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("organizations")
        .update({ is_internal_test_org: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_orgs"] });
      toast.success("Bijgewerkt");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteOrg = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke("admin-tester-ops", {
        body: { action: "delete_organization", organization_id: id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      toast.success("Organisatie verwijderd");
      qc.invalidateQueries({ queryKey: ["admin_orgs"] });
      qc.invalidateQueries({ queryKey: ["admin_org_member_counts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (orgs ?? []).filter(
    (o: any) =>
      !search ||
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.kvk_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.btw_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam, KVK, BTW of email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md"
          />
          <Badge variant="outline" className="ml-auto">{filtered.length}</Badge>
        </div>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead className="hidden md:table-cell">Eigenaar</TableHead>
                  <TableHead className="hidden sm:table-cell">KVK / BTW</TableHead>
                  <TableHead className="hidden md:table-cell">Leden</TableHead>
                  <TableHead className="hidden md:table-cell">Aangemaakt</TableHead>
                  <TableHead className="text-right">
                    <span className="inline-flex items-center gap-1"><Beaker className="h-3.5 w-3.5" /> Test</span>
                  </TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o: any) => {
                  const owner = owners?.[o.id];
                  return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{o.name}</div>
                      {o.email && <div className="text-xs text-muted-foreground break-all">{o.email}</div>}
                      <div className="md:hidden text-[11px] text-muted-foreground mt-0.5">
                        {owner?.email ? `👤 ${owner.email}` : ""}
                      </div>
                      <div className="sm:hidden text-[11px] text-muted-foreground mt-0.5">
                        {o.kvk_number ?? "—"} {o.btw_number ? `· ${o.btw_number}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      {owner ? (
                        <div>
                          <div className="text-foreground">{owner.full_name || "—"}</div>
                          <div className="text-muted-foreground break-all">{owner.email ?? "—"}</div>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {o.kvk_number ?? "—"} {o.btw_number ? `· ${o.btw_number}` : ""}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{memberCounts?.[o.id] ?? 0}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {o.created_at ? format(new Date(o.created_at), "d MMM yyyy", { locale: nl }) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={!!o.is_internal_test_org}
                        onCheckedChange={(v) => toggleTestOrg.mutate({ id: o.id, value: v })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Organisatie "${o.name}" definitief verwijderen? Alle gekoppelde data gaat verloren.`)) {
                            deleteOrg.mutate(o.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Geen organisaties gevonden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Test sandbox-organisaties krijgen automatisch toegang tot alle feature flags die "test orgs" toestaan. Gebruik dit om nieuwe versies te valideren voor breed uitrollen.
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Feature flags panel — global rollout + per-org overrides
// ============================================================================
function FeatureFlagsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", description: "" });
  const [overrideOpen, setOverrideOpen] = useState<string | null>(null);

  const { data: flags, isLoading } = useQuery({
    queryKey: ["admin_feature_flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("feature_flags" as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_feature_flags"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("feature_flags" as any)
        .insert({ key: form.key.trim(), name: form.name.trim(), description: form.description.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feature flag aangemaakt");
      qc.invalidateQueries({ queryKey: ["admin_feature_flags"] });
      setOpen(false);
      setForm({ key: "", name: "", description: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feature_flags" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verwijderd");
      qc.invalidateQueries({ queryKey: ["admin_feature_flags"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nieuwe flag
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {(flags ?? []).map((f: any) => (
          <Card key={f.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <ToggleRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground break-all">{f.name}</h3>
                    <Badge variant="outline" className="font-mono text-[10px]">{f.key}</Badge>
                    {f.enabled_globally && <Badge className="text-[10px]">Live voor iedereen</Badge>}
                  </div>
                  {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutate(f.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Verwijderen
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 pt-3 border-t border-border">
                <label className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-foreground">Globaal aan</span>
                  <Switch
                    checked={!!f.enabled_globally}
                    onCheckedChange={(v) => update.mutate({ id: f.id, patch: { enabled_globally: v } })}
                  />
                </label>
                <label className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-foreground">Test orgs auto</span>
                  <Switch
                    checked={!!f.enabled_for_test_orgs}
                    onCheckedChange={(v) => update.mutate({ id: f.id, patch: { enabled_for_test_orgs: v } })}
                  />
                </label>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-foreground">Rollout</span>
                    <span className="text-muted-foreground tabular-nums">{f.rollout_percentage}%</span>
                  </div>
                  <Slider
                    value={[f.rollout_percentage]}
                    max={100}
                    step={5}
                    onValueCommit={(v) => update.mutate({ id: f.id, patch: { rollout_percentage: v[0] } })}
                  />
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setOverrideOpen(f.key)}
                className="gap-2"
              >
                <Building2 className="h-3.5 w-3.5" /> Per-organisatie overrides
              </Button>
            </CardContent>
          </Card>
        ))}
        {(flags ?? []).length === 0 && !isLoading && (
          <p className="text-sm text-center text-muted-foreground py-8">Nog geen feature flags</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe feature flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Key (bv. new_dashboard_v2)"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
            />
            <Input
              placeholder="Naam"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Textarea
              placeholder="Beschrijving (optioneel)"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button
              disabled={!form.key || !form.name || create.isPending}
              onClick={() => create.mutate()}
            >
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {overrideOpen && (
        <OverridesDialog featureKey={overrideOpen} onClose={() => setOverrideOpen(null)} />
      )}
    </div>
  );
}

function OverridesDialog({ featureKey, onClose }: { featureKey: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [orgQuery, setOrgQuery] = useState("");

  const { data: overrides } = useQuery({
    queryKey: ["overrides", featureKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_feature_overrides" as any)
        .select("id, organization_id, enabled, reason, organizations(name)")
        .eq("feature_key", featureKey);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: orgs } = useQuery({
    queryKey: ["admin_orgs_lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addOverride = useMutation({
    mutationFn: async ({ orgId, enabled }: { orgId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("org_feature_overrides" as any)
        .upsert(
          { organization_id: orgId, feature_key: featureKey, enabled },
          { onConflict: "organization_id,feature_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overrides", featureKey] });
      toast.success("Override opgeslagen");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeOverride = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("org_feature_overrides" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["overrides", featureKey] }),
  });

  const filteredOrgs = (orgs ?? []).filter((o: any) =>
    !orgQuery || o.name.toLowerCase().includes(orgQuery.toLowerCase())
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{featureKey} — overrides</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Actieve overrides</p>
          {(overrides ?? []).map((o: any) => (
            <div key={o.id} className="flex items-center gap-2 p-2 border border-border rounded-md">
              <Badge className={cn("text-[10px]", o.enabled ? "" : "bg-muted text-muted-foreground")}>
                {o.enabled ? "AAN" : "UIT"}
              </Badge>
              <span className="text-sm flex-1">{o.organizations?.name ?? o.organization_id}</span>
              <Button size="sm" variant="ghost" onClick={() => removeOverride.mutate(o.id)}>
                Verwijder
              </Button>
            </div>
          ))}
          {(overrides ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">Geen overrides</p>
          )}
        </div>

        <div className="space-y-2 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Voeg organisatie toe</p>
          <Input
            placeholder="Zoek organisatie..."
            value={orgQuery}
            onChange={(e) => setOrgQuery(e.target.value)}
          />
          <div className="max-h-60 overflow-auto space-y-1">
            {filteredOrgs.slice(0, 20).map((o: any) => (
              <div key={o.id} className="flex items-center gap-2 p-2 hover:bg-secondary rounded-md">
                <span className="text-sm flex-1">{o.name}</span>
                <Button size="sm" variant="outline" onClick={() => addOverride.mutate({ orgId: o.id, enabled: true })}>
                  Aan
                </Button>
                <Button size="sm" variant="ghost" onClick={() => addOverride.mutate({ orgId: o.id, enabled: false })}>
                  Uit
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Releases panel — version notes that auto-broadcast to customers
// ============================================================================
function ReleasesPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ version: "", title: "", body: "", broadcast: true });

  const { data: notes, isLoading } = useQuery({
    queryKey: ["admin_release_notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("release_notes" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const publish = useMutation({
    mutationFn: async () => {
      const { data: note, error } = await supabase
        .from("release_notes" as any)
        .insert({
          version: form.version.trim(),
          title: form.title.trim(),
          body: form.body.trim(),
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      if (form.broadcast) {
        const { error: bErr } = await supabase.from("broadcasts").insert({
          title: `${form.version} — ${form.title}`,
          body: form.body,
          kind: "announcement",
          audience: "all",
          show_as_banner: false,
        } as any);
        if (bErr) throw bErr;
      }
      return note;
    },
    onSuccess: () => {
      toast.success("Release gepubliceerd");
      qc.invalidateQueries({ queryKey: ["admin_release_notes"] });
      qc.invalidateQueries({ queryKey: ["admin_broadcasts"] });
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
      setOpen(false);
      setForm({ version: "", title: "", body: "", broadcast: true });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("release_notes" as any)
        .update({ is_published: value, published_at: value ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_release_notes"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nieuwe release
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {(notes ?? []).map((n: any) => (
          <Card key={n.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-[10px]">{n.version}</Badge>
                    <h3 className="font-semibold text-foreground">{n.title}</h3>
                    {n.is_published ? (
                      <Badge className="text-[10px]">Live</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Concept</Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {n.published_at
                        ? format(new Date(n.published_at), "d MMM yyyy", { locale: nl })
                        : formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nl })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{n.body}</p>
                </div>
                <Switch
                  checked={!!n.is_published}
                  onCheckedChange={(v) => togglePublish.mutate({ id: n.id, value: v })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {(notes ?? []).length === 0 && !isLoading && (
          <p className="text-sm text-center text-muted-foreground py-8">Nog geen releases</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nieuwe release publiceren</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Versie (bv. v1.4.0)"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
            <Input
              placeholder="Titel (bv. Bank-import & nieuwe widgets)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Textarea
              placeholder="Wat is er nieuw, beter of opgelost?"
              rows={6}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={form.broadcast}
                onCheckedChange={(v) => setForm({ ...form, broadcast: !!v })}
              />
              Direct als aankondiging tonen aan alle klanten
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button
              disabled={!form.version || !form.title || !form.body || publish.isPending}
              onClick={() => publish.mutate()}
            >
              Publiceren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────── Testers ───────────────────────────
function TestersPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", org_name: "", seed_demo_data: true });
  const [result, setResult] = useState<null | { email: string; password: string; organization_id: string }>(null);

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-create-tester", { body: form });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { email: string; password: string; organization_id: string };
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Tester aangemaakt");
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      setForm({ email: "", password: "", full_name: "", org_name: "", seed_demo_data: true });
    },
    onError: (e: any) => toast.error(e.message ?? "Fout bij aanmaken"),
  });

  const testersList = useQuery({
    queryKey: ["admin_testers_list"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-tester-ops", {
        body: { action: "list_testers" },
      });
      if (error) throw error;
      return (data as any).testers as Array<{
        organization_id: string;
        organization_name: string;
        organization_created_at: string;
        owner_user_id: string | null;
        email: string | null;
        full_name: string | null;
        last_sign_in_at: string | null;
        user_created_at: string | null;
        email_confirmed_at: string | null;
      }>;
    },
  });

  const deleteTester = useMutation({
    mutationFn: async (t: { organization_id: string; owner_user_id: string | null }) => {
      if (t.owner_user_id) {
        const { data, error } = await supabase.functions.invoke("admin-tester-ops", {
          body: { action: "delete_user", user_id: t.owner_user_id },
        });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
      } else {
        const { data, error } = await supabase.functions.invoke("admin-tester-ops", {
          body: { action: "delete_organization", organization_id: t.organization_id },
        });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
      }
    },
    onSuccess: () => {
      toast.success("Tester verwijderd");
      qc.invalidateQueries({ queryKey: ["admin_testers_list"] });
      qc.invalidateQueries({ queryKey: ["admin_orgs"] });
      qc.invalidateQueries({ queryKey: ["admin_users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generatePassword = () => {
    const pw = Math.random().toString(36).slice(2, 6) + "-" + Math.random().toString(36).slice(2, 6);
    setForm((f) => ({ ...f, password: pw }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Tester-account aanmaken</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Maakt een gebruiker + tester-organisatie. Email is direct geverifieerd, paywall wordt overgeslagen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Volledige naam</label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jan Tester" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Email *</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tester@bedrijf.nl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Wachtwoord *</label>
              <div className="flex gap-2">
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="min. 8 tekens" />
                <Button type="button" variant="outline" onClick={generatePassword}>Genereer</Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Organisatienaam</label>
              <Input value={form.org_name} onChange={(e) => setForm({ ...form, org_name: e.target.value })} placeholder="Tester BV" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.seed_demo_data} onCheckedChange={(v) => setForm({ ...form, seed_demo_data: !!v })} />
            Demo-data meeladen (facturen, contacten, transacties)
          </label>

          <Button
            onClick={() => create.mutate()}
            disabled={!form.email || form.password.length < 8 || create.isPending}
          >
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tester aanmaken
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <h3 className="font-semibold text-foreground">Inloggegevens (deel met tester)</h3>
            <div className="grid grid-cols-[90px_1fr_auto] md:grid-cols-[120px_1fr_auto] gap-2 text-sm items-center">
              <span className="text-muted-foreground">Email</span>
              <code className="font-mono bg-secondary px-2 py-1 rounded text-xs md:text-sm break-all">{result.email}</code>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(result.email); toast.success("Gekopieerd"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <span className="text-muted-foreground">Wachtwoord</span>
              <code className="font-mono bg-secondary px-2 py-1 rounded text-xs md:text-sm break-all">{result.password}</code>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(result.password); toast.success("Gekopieerd"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => {
              navigator.clipboard.writeText(`Login: ${window.location.origin}/login\nEmail: ${result.email}\nWachtwoord: ${result.password}`);
              toast.success("Volledige inlog gekopieerd");
            }}>
              Kopieer volledige instructies
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Actieve testers</h2>
            <Badge variant="outline" className="ml-auto">{testersList.data?.length ?? 0}</Badge>
          </div>
          {testersList.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (testersList.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nog geen testers</p>
          ) : (
            <div className="border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tester</TableHead>
                    <TableHead className="hidden sm:table-cell">Organisatie</TableHead>
                    <TableHead className="hidden md:table-cell">Aangemaakt</TableHead>
                    <TableHead className="hidden md:table-cell">Laatst ingelogd</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(testersList.data ?? []).map((t) => (
                    <TableRow key={t.organization_id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{t.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground break-all">{t.email ?? "—"}</div>
                        <div className="sm:hidden text-[11px] text-muted-foreground mt-0.5">{t.organization_name}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{t.organization_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {t.user_created_at ? format(new Date(t.user_created_at), "d MMM yyyy HH:mm", { locale: nl }) : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {t.last_sign_in_at
                          ? `${format(new Date(t.last_sign_in_at), "d MMM HH:mm", { locale: nl })} (${formatDistanceToNow(new Date(t.last_sign_in_at), { addSuffix: true, locale: nl })})`
                          : <span className="text-muted-foreground/60">nooit</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Tester "${t.email ?? t.organization_name}" en bijbehorende organisatie definitief verwijderen?`)) {
                              deleteTester.mutate({ organization_id: t.organization_id, owner_user_id: t.owner_user_id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Login-tijden komen uit het authenticatiesysteem (laatste sessie). Verwijderen wist het account én de tester-organisatie.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────── Feedback ───────────────────────────
function FeedbackPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((f: any) => f.user_id).filter(Boolean)));
      const orgIds = Array.from(new Set((data ?? []).map((f: any) => f.organization_id).filter(Boolean)));
      const [{ data: profiles }, { data: orgs }] = await Promise.all([
        userIds.length
          ? supabase.from("user_profiles").select("id, full_name, email").in("id", userIds)
          : Promise.resolve({ data: [] as any[] }),
        orgIds.length
          ? supabase.from("organizations").select("id, name").in("id", orgIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const oMap = new Map((orgs ?? []).map((o: any) => [o.id, o]));
      return (data ?? []).map((f: any) => ({
        ...f,
        profile: pMap.get(f.user_id) ?? null,
        organization: oMap.get(f.organization_id) ?? null,
      }));
    },
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!data?.length) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nog geen feedback ontvangen.</CardContent></Card>;

  return (
    <div className="space-y-3">
      {data.map((f: any) => (
        <Card key={f.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{f.feedback_type}</Badge>
                {f.page_path && <code className="text-xs text-muted-foreground">{f.page_path}</code>}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(f.created_at), "d MMM HH:mm", { locale: nl })}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {f.profile?.full_name || f.profile?.email || (f.user_id ? `User ${f.user_id.slice(0, 8)}` : "Onbekende gebruiker")}
              {f.profile?.full_name && f.profile?.email ? ` · ${f.profile.email}` : ""}
              {f.organization?.name ? ` · ${f.organization.name}` : ""}
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{f.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

