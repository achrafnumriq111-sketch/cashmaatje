# Status van wat er al is

- **Kilometerregistratie:** Nee. Alleen één jaarlijks totaal-veld (`km_per_year`) in *Auto van de zaak* voor de forfaitaire €0,23/km vergoeding. Geen echte rittenadministratie.
- **Toeslagen:** Nee, helemaal niets.

# Wat ik wil bouwen

## 1. Kilometerregistratie (rittenadministratie)

Volwaardige module onder **Salaris → Auto/Kilometers**, naast bestaande "Auto van de zaak".

**Functionaliteit:**
- Rit toevoegen: datum, van → naar (adres of postcode), kilometers, doel/omschrijving, type (zakelijk / woon-werk / privé), gekoppeld contact (optioneel klant).
- Quick-add knop op dashboard + mobiele knop "Nieuwe rit" met geo-tip.
- Optioneel: heen-en-terug toggle (verdubbelt km automatisch).
- Overzichtstabel per maand/kwartaal/jaar met filters en export (CSV/PDF) — Belastingdienst-conform.
- Automatische berekening:
  - Totaal zakelijk × €0,23 = aftrekbaar bedrag (privé-auto zakelijk gebruikt)
  - Of bij auto van de zaak: ≥500 km privé/jaar → bijtelling verplicht
- Koppeling met *Auto van de zaak*: vult `km_per_year` automatisch op basis van geregistreerde ritten.
- "Standaardroutes" opslaan (bv. kantoor → vaste klant) voor 1-klik invoer.

**Technisch (kort):**
- Nieuwe tabel `mileage_trips` (org_id, date, from_address, to_address, km, purpose, trip_type, contact_id, vehicle_id, return_trip, created_by) met RLS via `get_user_org_ids()`.
- Optioneel `mileage_routes` voor opgeslagen routes.
- Hook `useMileageTrips(year)` + pagina `src/pages/MileageLog.tsx`.
- Route `/salaris/kilometers` + ModuleCard op `SalaryOverview`.

## 2. Toeslagen-check

Nieuwe sectie onder **Salaris → Toeslagen** (Belastingdienst-toeslagen voor de privépersoon achter de onderneming).

**Welke toeslagen:**
1. **Zorgtoeslag** — inkomensgrens 2026 (alleenstaand/met partner), eigen vermogen.
2. **Huurtoeslag** — werkt nu ook deels voor vrije sector (huurgrens vervalt 2024+); huur, samenstelling huishouden, leeftijd, vermogen.
3. **Kinderopvangtoeslag** — uren opvang × tarief × % afhankelijk van inkomen.
4. **Kindgebonden budget** — aantal kinderen, leeftijd, inkomen, vermogen.

**UX:**
- Pagina `/salaris/toeslagen` met 4 kaarten (één per toeslag).
- Per kaart: indicatie ✅ recht / ⚠️ grensgeval / ❌ geen recht + geschat bedrag/maand.
- Klik op kaart → detailformulier (samenstelling huishouden, huur, kinderen, vermogen). Inkomen wordt voor-ingevuld op basis van **belastbare winst** uit `useTaxDeductions` + eventuele partner.
- Disclaimer: "Indicatie, definitieve berekening via toeslagen.nl".
- Knop "Aanvragen" → deeplink naar `mijntoeslagen.nl`.

**Technisch (kort):**
- Tabel `benefits_profile` (org_id of user_id, has_partner, partner_income, num_children, children_ages jsonb, monthly_rent, rent_type, has_childcare, childcare_hours, childcare_rate, assets, updated_at).
- Pure rekenfuncties in `src/lib/benefits/` met grenswaarden 2025/2026 (constants per toeslag, jaarlijks updatebaar).
- Hook `useBenefits()` + pagina `src/pages/Benefits.tsx`.
- ModuleCard op `SalaryOverview` voor totaal toeslagen/jaar.

## Navigatie & integratie

- Beide pagina's toegevoegd aan `AppSidebar` onder "Salaris".
- Twee nieuwe ModuleCards op `SalaryOverview` (Kilometers + Toeslagen).
- App.tsx routes registreren.
- Beide gerespecteerd door bestaande `SubscriptionGate` (betaalde feature).

# Open vragen

1. Wil je voor kilometerregistratie ook automatische **GPS-tracking** (telefoon registreert ritten) of is **handmatig invoeren + opgeslagen routes** voldoende voor v1? GPS is complex (PWA permissions) — ik raad aan v1 handmatig + bulk-import CSV.
2. Toeslagen — moeten die per **gebruiker** (privépersoon) zijn of per **organisatie**? Logischer per gebruiker want het is privé, maar dan moeten we user-scoped opslaan i.p.v. org-scoped.
3. Moet ik ook **AOW/pensioen-indicatie** of **bijstand-check** toevoegen, of voorlopig alleen de 4 hoofdtoeslagen?

Laat me weten en dan bouw ik het.
