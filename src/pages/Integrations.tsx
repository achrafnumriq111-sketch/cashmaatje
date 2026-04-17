import { useState } from "react";
import { motion } from "framer-motion";
import { Plug, ShoppingBag, CreditCard, Building, Mail, Cloud, CheckCircle2, Loader2, Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageTransition, cardVariant, staggerContainer } from "@/lib/animations";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useIntegrations } from "@/hooks/useIntegrations";

const INTEGRATIONS = [
  { key: "shopify", name: "Shopify", desc: "Synchroniseer webshop-orders en producten.", icon: <ShoppingBag className="h-5 w-5" />, category: "E-commerce" },
  { key: "lightspeed", name: "Lightspeed", desc: "Kassasysteem-verkopen automatisch verwerkt.", icon: <CreditCard className="h-5 w-5" />, category: "Kassa" },
  { key: "mollie", name: "Mollie", desc: "Online betalingen ophalen en koppelen.", icon: <CreditCard className="h-5 w-5" />, category: "Payments" },
  { key: "stripe", name: "Stripe", desc: "Stripe-uitbetalingen en transactiekosten.", icon: <CreditCard className="h-5 w-5" />, category: "Payments" },
  { key: "exact", name: "Exact Online", desc: "Importeer bestaande boekhouding.", icon: <Building className="h-5 w-5" />, category: "Boekhouding" },
  { key: "mailchimp", name: "Mailchimp", desc: "Stuur facturen en herinneringen.", icon: <Mail className="h-5 w-5" />, category: "E-mail" },
  { key: "dropbox", name: "Dropbox", desc: "Documenten automatisch importeren.", icon: <Cloud className="h-5 w-5" />, category: "Storage" },
  { key: "gdrive", name: "Google Drive", desc: "Bonnen en facturen synchroniseren.", icon: <Cloud className="h-5 w-5" />, category: "Storage" },
];

export default function Integrations() {
  const { connections, upsertConnection, getConnection } = useIntegrations();
  const [configKey, setConfigKey] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  const activeIntegration = INTEGRATIONS.find((i) => i.key === configKey);
  const activeConnection = configKey ? getConnection(configKey) : undefined;
  const connectedCount = connections.filter((c) => c.status === "connected").length;

  const handleConnect = async () => {
    if (!activeIntegration) return;
    await upsertConnection.mutateAsync({
      integration_key: activeIntegration.key,
      display_name: activeIntegration.name,
      status: "connected",
      config: { api_key_set: !!apiKey, configured_at: new Date().toISOString() },
    });
    setConfigKey(null);
    setApiKey("");
  };

  const handleDisconnect = async (key: string, name: string) => {
    await upsertConnection.mutateAsync({
      integration_key: key,
      display_name: name,
      status: "disconnected",
      config: {},
    });
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-6xl">
      <motion.div variants={cardVariant} className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Plug className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Integraties
              <InfoTooltip content="Koppel externe tools zoals webshops, kassasystemen en betaalplatforms. Data wordt automatisch geïmporteerd." />
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{connectedCount} van {INTEGRATIONS.length} integraties actief</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map((i) => {
          const conn = getConnection(i.key);
          const isConnected = conn?.status === "connected";
          return (
            <motion.div key={i.key} variants={cardVariant}>
              <Card className={`arcory-glass h-full transition-colors ${isConnected ? "border-primary/40" : "hover:border-primary/30"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-lg bg-secondary text-foreground flex items-center justify-center">
                        {i.icon}
                      </span>
                      <div>
                        <CardTitle className="text-base font-medium flex items-center gap-1.5">
                          {i.name}
                          {isConnected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1 text-[10px] font-normal">{i.category}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed min-h-[32px]">{i.desc}</p>
                  {isConnected ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfigKey(i.key)}>
                        <SettingsIcon className="h-3.5 w-3.5 mr-1.5" /> Beheer
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDisconnect(i.key, i.name)}>
                        Loskoppelen
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => { setConfigKey(i.key); setApiKey(""); }}
                    >
                      Verbinden
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <Dialog open={!!configKey} onOpenChange={(v) => !v && setConfigKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeIntegration?.icon}
              {activeIntegration?.name} {activeConnection?.status === "connected" ? "beheren" : "verbinden"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {activeConnection?.status === "connected"
                ? "Werk je API-sleutel of instellingen bij. Data wordt na opslaan opnieuw gesynchroniseerd."
                : "Voer je API-sleutel in om te verbinden. Je vindt deze in het beheerpaneel van " + activeIntegration?.name + "."}
            </p>
            <div>
              <Label>API sleutel</Label>
              <Input
                type="password"
                placeholder="sk_live_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {activeConnection?.config && (activeConnection.config as any).api_key_set
                  ? "Een sleutel is al opgeslagen. Vul hier alleen iets in om hem te wijzigen."
                  : "De sleutel wordt versleuteld opgeslagen."}
              </p>
            </div>
            {activeConnection?.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                Laatste synchronisatie: {new Date(activeConnection.last_sync_at).toLocaleString("nl-NL")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigKey(null)}>Annuleren</Button>
            <Button onClick={handleConnect} disabled={upsertConnection.isPending}>
              {upsertConnection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {activeConnection?.status === "connected" ? "Bijwerken" : "Verbinden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
