import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Trash2, Route as RouteIcon, Crosshair, Car, Briefcase, Home as HomeIcon, User, Download, Radio, Sparkles, Square } from "lucide-react";
import { useMileageTrips, KM_RATE_BUSINESS, type MileageTrip, type TripType, type MileageRoute } from "@/hooks/useMileageTrips";
import { useContacts } from "@/hooks/useContacts";
import { useGpsTracker, type DetectedTrip } from "@/hooks/useGpsTracker";
import { classifyTrip, type ContactAddress } from "@/lib/mileage/classify";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtKm = (n: number) => `${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(n)} km`;

const tripTypeLabel: Record<TripType, string> = {
  business: "Zakelijk",
  commute: "Woon-werk",
  private: "Privé",
};
const tripTypeIcon: Record<TripType, React.ReactNode> = {
  business: <Briefcase className="h-3 w-3" />,
  commute: <HomeIcon className="h-3 w-3" />,
  private: <User className="h-3 w-3" />,
};

function emptyTrip(): MileageTrip {
  return {
    trip_date: new Date().toISOString().slice(0, 10),
    from_address: "",
    to_address: "",
    km: 0,
    return_trip: false,
    trip_type: "business",
    purpose: "",
  };
}

function emptyRoute(): MileageRoute {
  return { name: "", from_address: "", to_address: "", km: 0, default_trip_type: "business" };
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const j = await r.json();
    return j.display_name ?? fallback;
  } catch {
    return fallback;
  }
}

export default function MileageLog() {
  const [year, setYear] = useState(currentYear);
  const { trips, routes, loading, saveTrip, deleteTrip, saveRoute, deleteRoute, totals, businessDeduction } =
    useMileageTrips(year);
  const { data: contactsData } = useContacts({ search: "", type: "all", country: "all", riskStatus: "all" });
  const contacts: ContactAddress[] = useMemo(() => (contactsData ?? []) as any, [contactsData]);
  const { toast } = useToast();

  const [tripOpen, setTripOpen] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [trip, setTrip] = useState<MileageTrip>(emptyTrip());
  const [route, setRoute] = useState<MileageRoute>(emptyRoute());
  const [gpsLoading, setGpsLoading] = useState<"from" | "to" | null>(null);
  const [autoClassify, setAutoClassify] = useState(true);
  const [classification, setClassification] = useState<{ reason: string; confidence: number } | null>(null);

  // Always-on GPS tracker
  const handleDetectedTrip = async (detected: DetectedTrip) => {
    const [from_address, to_address] = await Promise.all([
      reverseGeocode(detected.startLat, detected.startLng),
      reverseGeocode(detected.endLat, detected.endLng),
    ]);
    const newTrip: MileageTrip = {
      trip_date: new Date(detected.startedAt).toISOString().slice(0, 10),
      from_address,
      to_address,
      from_lat: detected.startLat,
      from_lng: detected.startLng,
      to_lat: detected.endLat,
      to_lng: detected.endLng,
      km: detected.km,
      return_trip: false,
      trip_type: "private",
      purpose: "Automatisch gedetecteerd via GPS",
      source: "gps-auto",
    };
    const result = classifyTrip({
      fromAddress: from_address,
      toAddress: to_address,
      contacts,
      routes,
    });
    newTrip.trip_type = result.tripType;
    if (result.matchedContact) newTrip.contact_id = result.matchedContact.id;
    if (result.matchedRoute) newTrip.route_id = result.matchedRoute.id ?? null;
    await saveTrip(newTrip);
    toast({
      title: `Rit geregistreerd · ${detected.km.toFixed(1)} km`,
      description: `${result.reason} (${Math.round(result.confidence * 100)}% zeker)`,
    });
  };
  const tracker = useGpsTracker(handleDetectedTrip);

  // Auto-classificeer wanneer adressen veranderen in dialoog
  useEffect(() => {
    if (!autoClassify || !tripOpen || !trip.from_address || !trip.to_address) {
      setClassification(null);
      return;
    }
    const result = classifyTrip({
      fromAddress: trip.from_address,
      toAddress: trip.to_address,
      contacts,
      routes,
    });
    setClassification({ reason: result.reason, confidence: result.confidence });
    setTrip((prev) => ({
      ...prev,
      trip_type: result.tripType,
      contact_id: result.matchedContact?.id ?? prev.contact_id ?? null,
      route_id: result.matchedRoute?.id ?? prev.route_id ?? null,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.from_address, trip.to_address, autoClassify, tripOpen]);

  const captureGps = async (which: "from" | "to") => {
    if (!navigator.geolocation) {
      toast({ title: "GPS niet beschikbaar", description: "Je browser ondersteunt geen locatie.", variant: "destructive" });
      return;
    }
    setGpsLoading(which);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse-geocode via Nominatim (gratis, geen key nodig)
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const j = await r.json();
          address = j.display_name ?? address;
        } catch {}
        setTrip((prev) => ({
          ...prev,
          [`${which}_address`]: address,
          [`${which}_lat`]: latitude,
          [`${which}_lng`]: longitude,
        }));
        // Auto-bereken km als beide coords bekend
        setTimeout(() => {
          setTrip((prev) => {
            if (prev.from_lat && prev.from_lng && prev.to_lat && prev.to_lng) {
              const km = haversine(prev.from_lat, prev.from_lng, prev.to_lat, prev.to_lng);
              return { ...prev, km: Number(km.toFixed(1)) };
            }
            return prev;
          });
        }, 100);
        setGpsLoading(null);
        toast({ title: "Locatie vastgelegd", description: address });
      },
      (err) => {
        setGpsLoading(null);
        toast({ title: "Kon locatie niet ophalen", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveTrip = async () => {
    if (!trip.from_address || !trip.to_address || trip.km <= 0) {
      toast({ title: "Vul alle velden", description: "Adressen en kilometers zijn verplicht.", variant: "destructive" });
      return;
    }
    await saveTrip(trip);
    toast({ title: "Rit opgeslagen", description: `${trip.from_address} → ${trip.to_address}` });
    setTripOpen(false);
    setTrip(emptyTrip());
  };

  const useRoute = (r: MileageRoute) => {
    setTrip({
      ...emptyTrip(),
      from_address: r.from_address,
      to_address: r.to_address,
      km: r.km,
      trip_type: r.default_trip_type,
      contact_id: r.default_contact_id ?? null,
      route_id: r.id,
      source: "route",
    });
    setTripOpen(true);
  };

  const exportCsv = () => {
    const header = "Datum;Van;Naar;Type;Km;Doel;Retour\n";
    const rows = trips
      .map((t) =>
        [t.trip_date, t.from_address, t.to_address, tripTypeLabel[t.trip_type], t.km, t.purpose ?? "", t.return_trip ? "Ja" : "Nee"]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kilometers-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kilometerregistratie</h1>
          <p className="text-sm text-muted-foreground mt-1">Houd je zakelijke ritten bij — Belastingdienst-conform.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" /> CSV
          </Button>
          <Dialog open={tripOpen} onOpenChange={setTripOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setTrip(emptyTrip())}>
                <Plus className="h-4 w-4 mr-1.5" /> Rit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{trip.id ? "Rit bewerken" : "Nieuwe rit"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Datum</Label>
                    <Input type="date" value={trip.trip_date} onChange={(e) => setTrip({ ...trip, trip_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={trip.trip_type} onValueChange={(v: TripType) => setTrip({ ...trip, trip_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Zakelijk</SelectItem>
                        <SelectItem value="commute">Woon-werk</SelectItem>
                        <SelectItem value="private">Privé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Vertrek</Label>
                  <div className="flex gap-2">
                    <Input value={trip.from_address} onChange={(e) => setTrip({ ...trip, from_address: e.target.value })} placeholder="Adres of postcode" />
                    <Button type="button" variant="outline" size="icon" onClick={() => captureGps("from")} disabled={gpsLoading === "from"}>
                      <Crosshair className={`h-4 w-4 ${gpsLoading === "from" ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Bestemming</Label>
                  <div className="flex gap-2">
                    <Input value={trip.to_address} onChange={(e) => setTrip({ ...trip, to_address: e.target.value })} placeholder="Adres of postcode" />
                    <Button type="button" variant="outline" size="icon" onClick={() => captureGps("to")} disabled={gpsLoading === "to"}>
                      <Crosshair className={`h-4 w-4 ${gpsLoading === "to" ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <Label>Kilometers</Label>
                    <Input type="number" step="0.1" value={trip.km} onChange={(e) => setTrip({ ...trip, km: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <Switch checked={trip.return_trip} onCheckedChange={(v) => setTrip({ ...trip, return_trip: v })} />
                    <Label className="text-sm font-normal">Heen + terug (×2)</Label>
                  </div>
                </div>
                <div>
                  <Label>Doel / omschrijving</Label>
                  <Textarea rows={2} value={trip.purpose ?? ""} onChange={(e) => setTrip({ ...trip, purpose: e.target.value })} placeholder="Klantbezoek, levering, …" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTripOpen(false)}>Annuleren</Button>
                <Button onClick={handleSaveTrip}>Opslaan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Zakelijk", value: fmtKm(totals.business), icon: <Briefcase className="h-5 w-5 text-primary" /> },
          { label: "Woon-werk", value: fmtKm(totals.commute), icon: <HomeIcon className="h-5 w-5 text-primary" /> },
          { label: "Privé", value: fmtKm(totals.private), icon: <User className="h-5 w-5 text-primary" /> },
          { label: `Aftrek (×€${KM_RATE_BUSINESS.toFixed(2)})`, value: fmt(businessDeduction), icon: <Car className="h-5 w-5 text-primary" /> },
        ].map((kpi, i) => (
          <motion.div key={i} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">{kpi.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-semibold tabular-nums">{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs defaultValue="trips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trips">Ritten</TabsTrigger>
          <TabsTrigger value="routes">Vaste routes ({routes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="trips">
          <Card className="arcory-glass">
            <CardHeader className="pb-3"><CardTitle className="text-base">Ritten {year}</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Laden…</p>
              ) : trips.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <MapPin className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Nog geen ritten geregistreerd.</p>
                  <p className="text-xs text-muted-foreground">Klik op "Rit" om je eerste rit toe te voegen, of gebruik GPS.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {trips.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/40 group">
                      <Badge variant="outline" className="gap-1 text-xs">{tripTypeIcon[t.trip_type]} {tripTypeLabel[t.trip_type]}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{t.from_address} → {t.to_address}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.trip_date).toLocaleDateString("nl-NL")} · {t.purpose || "—"}</p>
                      </div>
                      <span className="text-sm font-medium tabular-nums">{fmtKm(Number(t.km))}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => t.id && deleteTrip(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes">
          <Card className="arcory-glass">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Vaste routes</CardTitle>
              <Dialog open={routeOpen} onOpenChange={setRouteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => setRoute(emptyRoute())}>
                    <Plus className="h-4 w-4 mr-1.5" /> Route
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nieuwe vaste route</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Naam</Label><Input value={route.name} onChange={(e) => setRoute({ ...route, name: e.target.value })} placeholder="Kantoor → Klant X" /></div>
                    <div><Label>Vertrek</Label><Input value={route.from_address} onChange={(e) => setRoute({ ...route, from_address: e.target.value })} /></div>
                    <div><Label>Bestemming</Label><Input value={route.to_address} onChange={(e) => setRoute({ ...route, to_address: e.target.value })} /></div>
                    <div><Label>Kilometers</Label><Input type="number" step="0.1" value={route.km} onChange={(e) => setRoute({ ...route, km: Number(e.target.value) })} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRouteOpen(false)}>Annuleren</Button>
                    <Button onClick={async () => { await saveRoute(route); setRouteOpen(false); toast({ title: "Route opgeslagen" }); }}>Opslaan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {routes.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <RouteIcon className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Geen vaste routes. Sla veelgebruikte ritten op voor 1-klik invoer.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {routes.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/40 group">
                      <RouteIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.from_address} → {r.to_address}</p>
                      </div>
                      <span className="text-sm tabular-nums">{fmtKm(Number(r.km))}</span>
                      <Button size="sm" variant="outline" onClick={() => useRoute(r)}>Gebruik</Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => r.id && deleteRoute(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="arcory-glass">
        <CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Belastingdienst:</strong> bij gebruik van een privé-auto voor zakelijke ritten mag je €{KM_RATE_BUSINESS.toFixed(2)} per kilometer aftrekken.
            Heb je een auto van de zaak? Dan geldt bijtelling als je meer dan 500 km privé per jaar rijdt — registreer je privéritten dan zorgvuldig.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a)) * 1.3; // 1.3× factor voor wegafstand
}
