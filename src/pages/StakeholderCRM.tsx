import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Plus, Search, Building2, Phone, Mail, FileText,
  Star, Clock, Euro, TrendingUp, Calendar, MessageSquare,
  ChevronRight, Filter
} from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { useInvoices } from "@/hooks/useInvoices";
import type { InvoiceFilters } from "@/hooks/useInvoices";
import { pageTransition, staggerContainer, cardVariant, fadeInUp } from "@/lib/animations";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const pipelineStages = [
  { id: "lead", label: "Lead", color: "bg-blue-500/20 text-blue-400" },
  { id: "prospect", label: "Prospect", color: "bg-amber-500/20 text-amber-400" },
  { id: "client", label: "Klant", color: "bg-primary/20 text-primary" },
  { id: "vip", label: "VIP", color: "bg-purple-500/20 text-purple-400" },
];

function getRelationshipStrength(contact: any, invoices: any[]): number {
  const contactInvoices = invoices.filter(i => i.contact_id === contact.id);
  let score = 0;
  if (contactInvoices.length > 0) score += 20;
  if (contactInvoices.length > 5) score += 20;
  if (contactInvoices.length > 10) score += 10;
  if (contact.email) score += 10;
  if (contact.phone) score += 10;
  if (contact.btw_number) score += 10;
  if (contact.is_customer && contact.is_supplier) score += 10;
  const recentInv = contactInvoices.some(i => {
    const d = new Date(i.invoice_date);
    return (Date.now() - d.getTime()) < 90 * 24 * 60 * 60 * 1000;
  });
  if (recentInv) score += 10;
  return Math.min(score, 100);
}

function getRevenue(contactId: string, invoices: any[]): number {
  return invoices
    .filter(i => i.contact_id === contactId && i.invoice_type === "sales")
    .reduce((s, i) => s + (i.total_amount || 0), 0);
}

function getStage(contact: any, invoices: any[]): string {
  const rev = getRevenue(contact.id, invoices);
  if (rev > 10000) return "vip";
  if (rev > 0) return "client";
  if (contact.email) return "prospect";
  return "lead";
}

export default function StakeholderCRM() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pipeline");
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const defaultFilters = { search: "", type: "all" as const, country: "", riskStatus: "all" as const };
  const { data: contacts, isLoading } = useContacts(defaultFilters);
  const { invoices } = useInvoices();
  const allInvoices = invoices ?? [];
  const allContacts = contacts ?? [];

  const filtered = useMemo(() => {
    if (!search) return allContacts;
    const q = search.toLowerCase();
    return allContacts.filter((c: any) =>
      c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    );
  }, [allContacts, search]);

  const pipelineData = useMemo(() => {
    const map: Record<string, any[]> = { lead: [], prospect: [], client: [], vip: [] };
    filtered.forEach((c: any) => {
      const stage = getStage(c, allInvoices);
      map[stage]?.push(c);
    });
    return map;
  }, [filtered, allInvoices]);

  const totalRevenue = useMemo(() =>
    allContacts.reduce((s: number, c: any) => s + getRevenue(c.id, allInvoices), 0),
    [allContacts, allInvoices]
  );

  const timelineEvents = useMemo(() => {
    if (!selectedContact) return [];
    const events: { date: Date; type: string; desc: string }[] = [];
    allInvoices.filter(i => i.contact_id === selectedContact.id).forEach(i => {
      events.push({ date: new Date(i.invoice_date), type: "invoice", desc: `Factuur ${i.invoice_number} — €${i.total_amount?.toFixed(2)}` });
      if (i.paid_date) events.push({ date: new Date(i.paid_date), type: "payment", desc: `Betaling ontvangen voor ${i.invoice_number}` });
    });
    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);
  }, [selectedContact, allInvoices]);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stakeholder CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Relatiebeheer, pipeline en contactbeheer</p>
        </div>
        <Button className="gap-1.5"><Plus className="h-4 w-4" />Nieuw contact</Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Totaal contacten", value: allContacts.length, icon: Users, color: "text-primary" },
          { label: "Actieve klanten", value: pipelineData.client.length + pipelineData.vip.length, icon: Star, color: "text-amber-400" },
          { label: "Totale omzet", value: `€${(totalRevenue / 1000).toFixed(0)}k`, icon: Euro, color: "text-emerald-400" },
          { label: "VIP relaties", value: pipelineData.vip.length, icon: TrendingUp, color: "text-purple-400" },
        ].map(s => (
          <motion.div key={s.label} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-xl font-bold text-foreground">{s.value}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Card className="arcory-glass">
        <CardContent className="pt-4 pb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek stakeholder..." className="pl-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="cards">Kaarten</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-4">
            {pipelineStages.map(stage => (
              <div key={stage.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-[10px] ${stage.color}`}>{stage.label}</Badge>
                  <span className="text-xs text-muted-foreground">{pipelineData[stage.id]?.length ?? 0}</span>
                </div>
                <div className="space-y-2">
                  {(pipelineData[stage.id] ?? []).slice(0, 8).map((c: any) => (
                    <motion.div key={c.id} variants={cardVariant} whileHover={{ scale: 1.02 }}>
                      <Card
                        className="arcory-glass hover:border-primary/30 cursor-pointer transition-all"
                        onClick={() => { setSelectedContact(c); setActiveTab("timeline"); }}
                      >
                        <CardContent className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{c.email || "Geen email"}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-medium text-primary">€{getRevenue(c.id, allInvoices).toFixed(0)}</p>
                              <div className="flex gap-0.5 mt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < Math.ceil(getRelationshipStrength(c, allInvoices) / 20) ? "bg-primary" : "bg-muted"}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, 18).map((c: any) => {
                const strength = getRelationshipStrength(c, allInvoices);
                const revenue = getRevenue(c.id, allInvoices);
                return (
                  <motion.div key={c.id} variants={cardVariant}>
                    <Card
                      className="arcory-glass hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => { setSelectedContact(c); setActiveTab("timeline"); }}
                    >
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {c.is_customer && "Klant"}{c.is_customer && c.is_supplier && " • "}{c.is_supplier && "Leverancier"}
                            </p>
                          </div>
                          <Badge className={`text-[9px] ${pipelineStages.find(s => s.id === getStage(c, allInvoices))?.color}`}>
                            {pipelineStages.find(s => s.id === getStage(c, allInvoices))?.label}
                          </Badge>
                        </div>
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</div>}
                          {c.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone}</div>}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                          <div className="flex items-center gap-1">
                            <Euro className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-foreground">€{revenue.toFixed(0)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400" />
                            <span className="text-[10px] text-muted-foreground">{strength}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          {selectedContact ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Contact detail */}
              <Card className="arcory-glass">
                <CardContent className="pt-5 space-y-4">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{selectedContact.name}</h3>
                    <Badge className="text-[10px] mt-1">{getStage(selectedContact, allInvoices)}</Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    {selectedContact.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-foreground">{selectedContact.email}</span></div>}
                    {selectedContact.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-foreground">{selectedContact.phone}</span></div>}
                    {selectedContact.address_city && <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-foreground">{selectedContact.address_city}</span></div>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <div className="text-center p-2 rounded-lg bg-muted/10">
                      <p className="text-lg font-bold text-primary">€{getRevenue(selectedContact.id, allInvoices).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">Omzet</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/10">
                      <p className="text-lg font-bold text-foreground">{getRelationshipStrength(selectedContact, allInvoices)}%</p>
                      <p className="text-[10px] text-muted-foreground">Relatiesterkte</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="arcory-glass lg:col-span-2">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Interactie timeline</CardTitle></CardHeader>
                <CardContent>
                  {timelineEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Geen interacties gevonden</p>
                  ) : (
                    <div className="space-y-0">
                      {timelineEvents.map((e, i) => (
                        <div key={i} className="flex gap-3 pb-4 relative">
                          {i < timelineEvents.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${e.type === "payment" ? "bg-primary/10" : "bg-blue-500/10"}`}>
                            {e.type === "payment" ? <Euro className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-blue-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground">{e.desc}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatDistanceToNow(e.date, { addSuffix: true, locale: nl })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="arcory-glass">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Selecteer een contact om de timeline te bekijken</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
