// Auto-classificatie van ritten op basis van adres-matching met contacten en vaste routes.
import type { TripType, MileageRoute } from "@/hooks/useMileageTrips";

export interface ContactAddress {
  id: string;
  name: string;
  is_customer?: boolean | null;
  is_supplier?: boolean | null;
  address_street?: string | null;
  address_postal_code?: string | null;
  address_city?: string | null;
}

export interface ClassifyInput {
  fromAddress: string;
  toAddress: string;
  fromLat?: number | null;
  fromLng?: number | null;
  toLat?: number | null;
  toLng?: number | null;
  contacts: ContactAddress[];
  routes: MileageRoute[];
  homeAddress?: string | null;
  workAddress?: string | null;
}

export interface ClassifyResult {
  tripType: TripType;
  confidence: number; // 0..1
  reason: string;
  matchedContact?: ContactAddress | null;
  matchedRoute?: MileageRoute | null;
}

function norm(s?: string | null) {
  return (s ?? "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s?: string | null) {
  return new Set(norm(s).split(" ").filter((t) => t.length > 2));
}

/** Jaccard-similariteit op tokens — robuust tegen volgorde en kleine afwijkingen. */
function similarity(a: string, b: string) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  ta.forEach((t) => tb.has(t) && inter++);
  return inter / new Set([...ta, ...tb]).size;
}

function contactAddressString(c: ContactAddress) {
  return [c.address_street, c.address_postal_code, c.address_city].filter(Boolean).join(" ");
}

/** Vind beste contact-match voor een adres (drempel 0.35). */
export function matchContact(address: string, contacts: ContactAddress[]): { contact: ContactAddress; score: number } | null {
  let best: { contact: ContactAddress; score: number } | null = null;
  for (const c of contacts) {
    const ca = contactAddressString(c);
    if (!ca) continue;
    const score = similarity(address, ca);
    if (score >= 0.35 && (!best || score > best.score)) best = { contact: c, score };
  }
  return best;
}

/** Vind beste route-match (zowel from als to moeten lijken). */
export function matchRoute(from: string, to: string, routes: MileageRoute[]): { route: MileageRoute; score: number } | null {
  let best: { route: MileageRoute; score: number } | null = null;
  for (const r of routes) {
    const s1 = Math.max(similarity(from, r.from_address), similarity(from, r.to_address));
    const s2 = Math.max(similarity(to, r.from_address), similarity(to, r.to_address));
    const score = (s1 + s2) / 2;
    if (score >= 0.4 && (!best || score > best.score)) best = { route: r, score };
  }
  return best;
}

export function classifyTrip(input: ClassifyInput): ClassifyResult {
  const { fromAddress, toAddress, contacts, routes, homeAddress, workAddress } = input;

  // 1. Vaste route → neem default type van die route
  const route = matchRoute(fromAddress, toAddress, routes);
  if (route) {
    return {
      tripType: route.route.default_trip_type,
      confidence: Math.min(0.95, 0.6 + route.score * 0.4),
      reason: `Komt overeen met opgeslagen route "${route.route.name}"`,
      matchedRoute: route.route,
    };
  }

  // 2. Eén kant matcht een contact → zakelijk
  const fromContact = matchContact(fromAddress, contacts);
  const toContact = matchContact(toAddress, contacts);
  const contactHit = toContact ?? fromContact;
  if (contactHit) {
    return {
      tripType: "business",
      confidence: Math.min(0.92, 0.55 + contactHit.score * 0.4),
      reason: `Adres herkend als ${contactHit.contact.is_customer ? "klant" : contactHit.contact.is_supplier ? "leverancier" : "contact"} "${contactHit.contact.name}"`,
      matchedContact: contactHit.contact,
    };
  }

  // 3. Woon ↔ werk → woon-werk
  if (homeAddress && workAddress) {
    const homeFrom = similarity(fromAddress, homeAddress);
    const workTo = similarity(toAddress, workAddress);
    const workFrom = similarity(fromAddress, workAddress);
    const homeTo = similarity(toAddress, homeAddress);
    const commuteScore = Math.max((homeFrom + workTo) / 2, (workFrom + homeTo) / 2);
    if (commuteScore >= 0.4) {
      return {
        tripType: "commute",
        confidence: Math.min(0.88, 0.5 + commuteScore * 0.4),
        reason: "Woon-werk traject herkend",
      };
    }
  }

  // 4. Geen match → privé met lage confidence (suggereer review)
  return {
    tripType: "private",
    confidence: 0.3,
    reason: "Geen match met contacten of routes — gemarkeerd als privé",
  };
}
