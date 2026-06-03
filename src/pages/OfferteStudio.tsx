import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Plus, Trash2, GripVertical, Palette, Image, Type,
  Send, ArrowRight, Copy, Download, Check, X, Upload, Euro
} from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { useContacts } from "@/hooks/useContacts";
import { useSaveQuote, generateQuotePdf } from "@/hooks/useQuotes";
import { toast } from "sonner";

interface QuoteLine {
  id: string;
  type: "service" | "product" | "package";
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  optional: boolean;
  discount: number;
}

interface QuoteBranding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  companyName: string;
  companyAddress: string;
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  footerText: string;
}

const defaultBranding: QuoteBranding = {
  logoUrl: "",
  primaryColor: "#10B981",
  secondaryColor: "#0a0a0a",
  fontFamily: "Inter",
  companyName: "",
  companyAddress: "",
  kvkNumber: "",
  btwNumber: "",
  iban: "",
  footerText: "Bedankt voor uw vertrouwen.",
};

interface QuoteTemplate {
  id: string;
  name: string;
  desc: string;
  lines: Omit<QuoteLine, "id">[];
}

const templates: QuoteTemplate[] = [
  {
    id: "accounting", name: "Boekhoudvoorstel", desc: "Standaard boekhoudpakket offerte",
    lines: [
      { type: "service", description: "Boekhouding (per maand)", quantity: 12, unitPrice: 150, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "BTW-aangifte (per kwartaal)", quantity: 4, unitPrice: 75, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "Jaarrekening", quantity: 1, unitPrice: 650, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "IB-aangifte ondernemer", quantity: 1, unitPrice: 295, vatRate: 21, optional: true, discount: 0 },
    ],
  },
  {
    id: "audit", name: "Controlevoorstel", desc: "Jaarrekeningcontrole offerte",
    lines: [
      { type: "service", description: "Controleverklaring jaarrekening", quantity: 1, unitPrice: 4500, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "Tussentijdse beoordeling", quantity: 2, unitPrice: 850, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "Risico-analyse en planning", quantity: 1, unitPrice: 1250, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "Managementletter", quantity: 1, unitPrice: 750, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "Nazorg en archivering", quantity: 1, unitPrice: 350, vatRate: 21, optional: true, discount: 0 },
    ],
  },
  {
    id: "consultancy", name: "Adviesvoorstel", desc: "Financieel adviestraject",
    lines: [
      { type: "service", description: "Strategie & financiële planning", quantity: 8, unitPrice: 175, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "Cashflow-prognose", quantity: 4, unitPrice: 175, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "Kwartaalreview", quantity: 4, unitPrice: 295, vatRate: 21, optional: false, discount: 0 },
    ],
  },
  {
    id: "compliance", name: "Compliance voorstel", desc: "Wet DBA / compliance check",
    lines: [
      { type: "service", description: "Modelovereenkomst review", quantity: 1, unitPrice: 495, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "Compliance audit", quantity: 1, unitPrice: 950, vatRate: 21, optional: false, discount: 0 },
      { type: "service", description: "Implementatieplan", quantity: 1, unitPrice: 650, vatRate: 21, optional: false, discount: 0 },
    ],
  },
  {
    id: "invoice", name: "Factuur template", desc: "Standaard factuurlayout",
    lines: [
      { type: "service", description: "Geleverde dienst", quantity: 1, unitPrice: 0, vatRate: 21, optional: false, discount: 0 },
    ],
  },
  {
    id: "recurring", name: "Periodieke factuur", desc: "Maandelijks terugkerend",
    lines: [
      { type: "service", description: "Maandelijkse abonnement", quantity: 1, unitPrice: 99, vatRate: 21, optional: false, discount: 0 },
    ],
  },
];

const packageOptions = [
  { name: "Basic", price: 199, features: ["Boekhouding", "BTW-aangifte", "Jaarrekening"], popular: false },
  { name: "Growth", price: 399, features: ["Alles in Basic", "Salarisadministratie", "Rapportages", "Adviesgesprekken"], popular: true },
  { name: "Premium", price: 699, features: ["Alles in Growth", "Controleverklaring", "Fiscale optimalisatie", "Dedicated accountant", "24/7 support"], popular: false },
];

export default function OfferteStudio() {
  const [activeTab, setActiveTab] = useState("builder");
  const [lines, setLines] = useState<QuoteLine[]>([
    { id: "1", type: "service", description: "Boekhouding Q1-Q4", quantity: 12, unitPrice: 150, vatRate: 21, optional: false, discount: 0 },
    { id: "2", type: "service", description: "BTW-aangifte", quantity: 4, unitPrice: 75, vatRate: 21, optional: false, discount: 0 },
  ]);
  const [branding, setBranding] = useState<QuoteBranding>(defaultBranding);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [validityDays, setValidityDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState("14 dagen");
  const [showPackages, setShowPackages] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState<"draft" | "sent" | "accepted" | "rejected">("draft");

  const defaultFilters = { search: "", type: "all" as const, country: "", riskStatus: "all" as const };
  const { data: contacts } = useContacts(defaultFilters);

  const addLine = (type: QuoteLine["type"]) => {
    setLines([...lines, {
      id: crypto.randomUUID(),
      type,
      description: "",
      quantity: 1,
      unitPrice: 0,
      vatRate: 21,
      optional: false,
      discount: 0,
    }]);
  };

  const updateLine = (id: string, updates: Partial<QuoteLine>) => {
    setLines(lines.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLine = (id: string) => setLines(lines.filter(l => l.id !== id));

  const activeLines = lines.filter(l => !l.optional);
  const subtotal = activeLines.reduce((s, l) => s + (l.quantity * l.unitPrice * (1 - l.discount / 100)), 0);
  const totalVat = activeLines.reduce((s, l) => {
    const lineTotal = l.quantity * l.unitPrice * (1 - l.discount / 100);
    return s + lineTotal * (l.vatRate / 100);
  }, 0);
  const total = subtotal + totalVat;

  const handleAccept = () => {
    setQuoteStatus("accepted");
    toast.success("Offerte geaccepteerd — wordt geconverteerd naar factuur");
  };

  const handleReject = () => {
    setQuoteStatus("rejected");
    toast.info("Offerte afgewezen");
  };

  const applyTemplate = (t: QuoteTemplate) => {
    setLines(t.lines.map((l) => ({ ...l, id: crypto.randomUUID() })));
    setActiveTab("builder");
    toast.success(`Template "${t.name}" geladen`);
  };

  const addPackage = (pkg: typeof packageOptions[number]) => {
    setLines([
      ...lines,
      {
        id: crypto.randomUUID(),
        type: "package",
        description: `Pakket ${pkg.name} — ${pkg.features.join(", ")}`,
        quantity: 1,
        unitPrice: pkg.price,
        vatRate: 21,
        optional: false,
        discount: 0,
      },
    ]);
    setActiveTab("builder");
    toast.success(`Pakket "${pkg.name}" toegevoegd aan offerte`);
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Offerte & Branding Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">Ontwerp, verstuur en beheer professionele offertes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("PDF geëxporteerd")}>
            <Download className="h-4 w-4" />Export PDF
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setQuoteStatus("sent"); toast.success("Offerte verstuurd"); }}>
            <Send className="h-4 w-4" />Verstuur
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="packages">Pakketten</TabsTrigger>
          <TabsTrigger value="approval">Goedkeuring</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Client info */}
            <Card className="arcory-glass lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Klantgegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Klantnaam</Label>
                    <Select value={clientName} onValueChange={setClientName}>
                      <SelectTrigger><SelectValue placeholder="Selecteer klant..." /></SelectTrigger>
                      <SelectContent>
                        {(contacts ?? []).filter((c: any) => c.is_customer).map((c: any) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="klant@email.nl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Geldigheid (dagen)</Label>
                    <Input type="number" value={validityDays} onChange={e => setValidityDays(+e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Betalingstermijn</Label>
                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="14 dagen">14 dagen</SelectItem>
                        <SelectItem value="30 dagen">30 dagen</SelectItem>
                        <SelectItem value="60 dagen">60 dagen</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className="arcory-glass">
              <CardContent className="pt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotaal</span>
                  <span className="font-medium text-foreground">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BTW</span>
                  <span className="text-foreground">€{totalVat.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-foreground">Totaal</span>
                  <span className="font-bold text-primary">€{total.toFixed(2)}</span>
                </div>
                <Badge variant={quoteStatus === "accepted" ? "default" : "outline"} className="w-full justify-center mt-2">
                  {quoteStatus === "draft" && "Concept"}
                  {quoteStatus === "sent" && "Verstuurd"}
                  {quoteStatus === "accepted" && "Geaccepteerd ✓"}
                  {quoteStatus === "rejected" && "Afgewezen ✗"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Line items */}
          <Card className="arcory-glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Regels</CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => addLine("service")}><Plus className="h-3 w-3" />Service</Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => addLine("product")}><Plus className="h-3 w-3" />Product</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {lines.map((line) => (
                <motion.div
                  key={line.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`grid grid-cols-[auto_1fr_80px_100px_70px_60px_36px] gap-2 items-center p-2 rounded-lg ${line.optional ? "opacity-50 bg-muted/20" : "bg-muted/10"}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                  <Input
                    value={line.description}
                    onChange={e => updateLine(line.id, { description: e.target.value })}
                    placeholder="Omschrijving..."
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    value={line.quantity}
                    onChange={e => updateLine(line.id, { quantity: +e.target.value })}
                    className="h-8 text-xs text-center"
                  />
                  <Input
                    type="number"
                    value={line.unitPrice}
                    onChange={e => updateLine(line.id, { unitPrice: +e.target.value })}
                    className="h-8 text-xs"
                    placeholder="€"
                  />
                  <Select value={String(line.vatRate)} onValueChange={v => updateLine(line.id, { vatRate: +v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="9">9%</SelectItem>
                      <SelectItem value="21">21%</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={line.optional}
                      onCheckedChange={v => updateLine(line.id, { optional: v })}
                      className="scale-75"
                    />
                    <span className="text-[9px] text-muted-foreground">Opt</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLine(line.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="arcory-glass">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Visuele identiteit</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Logo uploaden</Label>
                  <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/30 transition-colors">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Sleep je logo hierheen of klik om te uploaden</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Primaire kleur</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={branding.primaryColor} onChange={e => setBranding({ ...branding, primaryColor: e.target.value })} className="w-10 h-9 rounded cursor-pointer" />
                      <Input value={branding.primaryColor} onChange={e => setBranding({ ...branding, primaryColor: e.target.value })} className="font-mono text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Secundaire kleur</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={branding.secondaryColor} onChange={e => setBranding({ ...branding, secondaryColor: e.target.value })} className="w-10 h-9 rounded cursor-pointer" />
                      <Input value={branding.secondaryColor} onChange={e => setBranding({ ...branding, secondaryColor: e.target.value })} className="font-mono text-xs" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Lettertype</Label>
                  <Select value={branding.fontFamily} onValueChange={v => setBranding({ ...branding, fontFamily: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="arcory-glass">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Bedrijfsgegevens</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Bedrijfsnaam</Label>
                  <Input value={branding.companyName} onChange={e => setBranding({ ...branding, companyName: e.target.value })} placeholder="CashMaatje B.V." />
                </div>
                <div>
                  <Label className="text-xs">Adres</Label>
                  <Input value={branding.companyAddress} onChange={e => setBranding({ ...branding, companyAddress: e.target.value })} placeholder="Straat 1, 1000 AA Amsterdam" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">KVK-nummer</Label>
                    <Input value={branding.kvkNumber} onChange={e => setBranding({ ...branding, kvkNumber: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">BTW-nummer</Label>
                    <Input value={branding.btwNumber} onChange={e => setBranding({ ...branding, btwNumber: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">IBAN</Label>
                  <Input value={branding.iban} onChange={e => setBranding({ ...branding, iban: e.target.value })} placeholder="NL00 BANK 0000 0000 00" />
                </div>
                <div>
                  <Label className="text-xs">Voettekst</Label>
                  <Textarea value={branding.footerText} onChange={e => setBranding({ ...branding, footerText: e.target.value })} rows={2} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <motion.div key={t.id} variants={cardVariant}>
                <Card className="arcory-glass hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="pt-5 pb-4">
                    <FileText className="h-5 w-5 text-primary mb-3" />
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => applyTemplate(t)}>
                        <Copy className="h-3 w-3" />Gebruik
                      </Button>
                      <Badge variant="outline" className="text-[10px]">{t.lines.length} regels</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {packageOptions.map((pkg) => (
              <Card key={pkg.name} className={`arcory-glass relative ${pkg.popular ? "border-primary/50 ring-1 ring-primary/20" : ""}`}>
                {pkg.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px]">Meest gekozen</Badge>
                )}
                <CardContent className="pt-6 pb-5 text-center">
                  <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-bold text-primary">€{pkg.price}</span>
                    <span className="text-sm text-muted-foreground">/maand</span>
                  </div>
                  <ul className="space-y-2 text-left mb-5">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={pkg.popular ? "default" : "outline"} size="sm" onClick={() => addPackage(pkg)}>
                    Toevoegen aan offerte
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approval" className="mt-4">
          <Card className="arcory-glass max-w-lg mx-auto">
            <CardContent className="pt-6 pb-5 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Klant goedkeuring</h3>
              <p className="text-sm text-muted-foreground">
                De klant kan de offerte bekijken en direct accepteren of afwijzen met een digitale handtekening.
              </p>
              <div className="border border-border rounded-xl p-4 text-left space-y-2 bg-muted/10">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Offerte aan</span>
                  <span className="text-foreground">{clientName || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Totaalbedrag</span>
                  <span className="font-medium text-primary">€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={quoteStatus === "accepted" ? "default" : "outline"} className="text-[10px]">
                    {quoteStatus === "draft" ? "Concept" : quoteStatus === "sent" ? "Verstuurd" : quoteStatus === "accepted" ? "Geaccepteerd" : "Afgewezen"}
                  </Badge>
                </div>
              </div>
              {quoteStatus !== "accepted" && quoteStatus !== "rejected" && (
                <div className="flex gap-3 justify-center">
                  <Button className="gap-1.5" onClick={handleAccept}><Check className="h-4 w-4" />Accepteer & Teken</Button>
                  <Button variant="outline" className="gap-1.5" onClick={handleReject}><X className="h-4 w-4" />Afwijzen</Button>
                </div>
              )}
              {quoteStatus === "accepted" && (
                <div className="space-y-2">
                  <p className="text-xs text-primary flex items-center justify-center gap-1"><Check className="h-4 w-4" />Geaccepteerd op {new Date().toLocaleDateString("nl-NL")}</p>
                  <Button size="sm" className="gap-1.5" onClick={() => toast.success("Offerte omgezet naar factuur")}>
                    <ArrowRight className="h-4 w-4" />Converteer naar factuur
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
