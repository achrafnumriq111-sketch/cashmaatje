import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, Clock, Bell, FileText, Wallet, Users, Plus, Play,
  Send, ArrowRight, Zap, BarChart3, Megaphone, Loader2
} from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { toast } from "sonner";
import { useWorkflows, useSaveWorkflow, useToggleWorkflow, useDeleteWorkflow, type WorkflowRecord } from "@/hooks/useWorkflows";

const iconMap: Record<string, any> = {
  Mail, Clock, Bell, FileText, Wallet, Users, Zap,
};

const placeholders = [
  { tag: "{{klant_naam}}", desc: "Naam van de klant" },
  { tag: "{{factuurnummer}}", desc: "Factuurnummer" },
  { tag: "{{vervaldatum}}", desc: "Vervaldatum" },
  { tag: "{{bedrijfsnaam}}", desc: "Jouw bedrijfsnaam" },
  { tag: "{{betaallink}}", desc: "Link naar betaling" },
  { tag: "{{bedrag}}", desc: "Openstaand bedrag" },
];

export default function AutomationCenter() {
  const { data: workflows = [], isLoading } = useWorkflows();
  const toggleWf = useToggleWorkflow();
  const saveWf = useSaveWorkflow();
  const deleteWf = useDeleteWorkflow();

  const [activeTab, setActiveTab] = useState("workflows");
  const [emailSubject, setEmailSubject] = useState("Herinnering: Factuur {{factuurnummer}} openstaand");
  const [emailBody, setEmailBody] = useState("Beste {{klant_naam}},\n\nWij willen u vriendelijk herinneren dat factuur {{factuurnummer}} ter waarde van {{bedrag}} de vervaldatum van {{vervaldatum}} heeft overschreden.\n\nGelieve het bedrag binnen 7 dagen te voldoen via onderstaande link:\n{{betaallink}}\n\nMet vriendelijke groet,\n{{bedrijfsnaam}}");

  const handleToggle = async (w: WorkflowRecord) => {
    try {
      await toggleWf.mutateAsync({ id: w.id, active: !w.active });
      toast.success(w.active ? `"${w.title}" gedeactiveerd` : `"${w.title}" geactiveerd`);
    } catch (e: any) {
      toast.error(e.message ?? "Update mislukt");
    }
  };

  const handleNewWorkflow = async () => {
    try {
      await saveWf.mutateAsync({
        title: "Nieuwe workflow",
        description: "Beschrijving",
        icon: "Zap",
        trigger_type: "event",
        trigger_label: "Custom event",
        condition_expr: "IF ...",
        action_expr: "THEN ...",
        active: false,
      });
      toast.success("Workflow aangemaakt");
    } catch (e: any) {
      toast.error(e.message ?? "Aanmaken mislukt");
    }
  };

  const activeCount = workflows.filter((w) => w.active).length;
  const totalRuns = workflows.reduce((s, w) => s + (w.total_runs ?? 0), 0);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Automation Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Event-based email workflows en notificaties</p>
        </div>
        <Button className="gap-1.5" onClick={handleNewWorkflow} disabled={saveWf.isPending}>
          <Plus className="h-4 w-4" />Nieuwe workflow
        </Button>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Actieve workflows", value: activeCount, icon: Play, color: "text-primary" },
          { label: "Totaal uitgevoerd", value: totalRuns, icon: BarChart3, color: "text-blue-400" },
          { label: "Emails verzonden", value: totalRuns, icon: Send, color: "text-emerald-400" },
          { label: "Templates", value: 4, icon: FileText, color: "text-amber-400" },
        ].map((s) => (
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Workflows laden...
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-3">
              {workflows.map((w) => {
                const Icon = iconMap[w.icon ?? "Zap"] ?? Zap;
                return (
                  <motion.div key={w.id} variants={cardVariant}>
                    <Card className={`arcory-glass transition-all ${w.active ? "border-primary/20" : ""}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${w.active ? "bg-primary/10" : "bg-muted/50"}`}>
                            <Icon className={`h-5 w-5 ${w.active ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{w.title}</p>
                              <Badge variant="outline" className="text-[9px]">{w.trigger_type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{w.description}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              {w.condition_expr && (
                                <code className="text-[10px] text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">{w.condition_expr}</code>
                              )}
                              <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                              {w.action_expr && (
                                <code className="text-[10px] text-blue-400/80 bg-blue-400/5 px-1.5 py-0.5 rounded">{w.action_expr}</code>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">{w.total_runs}x</span>
                              <Switch checked={w.active} onCheckedChange={() => handleToggle(w)} />
                            </div>
                            {w.last_run_at && (
                              <p className="text-[10px] text-muted-foreground/60">
                                {new Date(w.last_run_at).toLocaleDateString("nl-NL")}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {workflows.length === 0 && (
                <Card className="arcory-glass">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Geen workflows. Klik op "Nieuwe workflow" om te starten.
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="arcory-glass">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Email template editor</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Onderwerp</Label>
                  <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Inhoud</Label>
                  <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} className="font-mono text-xs" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5" onClick={() => toast.success("Test e-mail wordt verstuurd")}><Send className="h-3.5 w-3.5" />Test versturen</Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success("Template opgeslagen")}>Opslaan als template</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="arcory-glass">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Beschikbare placeholders</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {placeholders.map((p) => (
                    <div
                      key={p.tag}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => { navigator.clipboard.writeText(p.tag); toast.success(`"${p.tag}" gekopieerd`); }}
                    >
                      <code className="text-xs text-primary font-mono">{p.tag}</code>
                      <span className="text-[11px] text-muted-foreground">{p.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <Card className="arcory-glass">
            <CardContent className="pt-6 text-center space-y-3">
              <Megaphone className="h-10 w-10 text-primary mx-auto" />
              <h3 className="text-base font-semibold text-foreground">Campagne modus</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Verstuur aankondigingen naar alle stakeholders. Bijvoorbeeld: nieuwe diensten, beschikbaarheid, financiële updates.
              </p>
              <div className="grid gap-3 max-w-sm mx-auto text-left">
                <Input placeholder="Campagne onderwerp..." />
                <Textarea placeholder="Campagne bericht..." rows={4} />
                <Select>
                  <SelectTrigger><SelectValue placeholder="Doelgroep selecteren..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle stakeholders</SelectItem>
                    <SelectItem value="clients">Alleen klanten</SelectItem>
                    <SelectItem value="suppliers">Alleen leveranciers</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="gap-1.5" onClick={() => toast.success("Campagne gestart")}><Send className="h-4 w-4" />Campagne versturen</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
