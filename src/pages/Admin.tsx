import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, CreditCard, Megaphone, MessageSquare, Loader2, Send, Plus, Search, Building2, Flag, Sparkles, Beaker, Shield, ToggleRight } from "lucide-react";
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin paneel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Beheer gebruikers, abonnementen en communicatie
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-3.5 w-3.5" /> Gebruikers
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="h-3.5 w-3.5" /> Abonnementen
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="gap-2">
            <Megaphone className="h-3.5 w-3.5" /> Aankondigingen
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <MessageSquare className="h-3.5 w-3.5" /> Support inbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-4">
          <SubscriptionsPanel />
        </TabsContent>
        <TabsContent value="broadcasts" className="mt-4">
          <BroadcastsPanel />
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
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op email of naam..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Badge variant="outline" className="ml-auto">{filtered.length} gebruikers</Badge>
        </div>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Aangemeld</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
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
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Actief" value={stats.active} tone="primary" />
        <StatCard label="Achterstallig" value={stats.pastDue} tone="warning" />
        <StatCard label="Geannuleerd" value={stats.canceled} tone="muted" />
      </div>
      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Env</TableHead>
                    <TableHead>Periode tot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.user_id?.slice(0, 8)}...</TableCell>
                      <TableCell className="capitalize">{s.price_id ?? "—"}</TableCell>
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
                      <TableCell className="text-xs text-muted-foreground">{s.environment}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
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
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p
          className={cn(
            "text-3xl font-bold",
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
        <CardContent className="p-3 space-y-2 max-h-[70vh] overflow-auto">
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

      <Card className="h-[70vh] flex flex-col">
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
