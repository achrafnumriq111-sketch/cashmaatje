# Cash Maatje — Trust & Credibility Upgrade

Doel: van "mooie SaaS-belofte" naar "betrouwbaar financieel systeem". Alle 5 prioriteiten in 1 batch.

## Prioriteit 1 — Security & Compliance zichtbaar

**Navigatie** aanpassen: Product · Toeslagencheck · Prijzen · Security · Login

**Nieuwe pagina `/security`** (`src/pages/Security.tsx`):
- Data-isolatie per bedrijf (row-level security in mensentaal)
- Encryptie at rest + in transit
- Dagelijkse back-ups + retentie
- Audit logs per gebruiker
- Rollen & rechten (eigenaar / medewerker / accountant)
- AVG/GDPR + EU-hosting
- "Wij trainen geen AI-modellen op jouw klantdata"
- Verwerkersovereenkomst op aanvraag

**Nieuwe pagina `/compliance`** (`src/pages/Compliance.tsx`):
- Hoe BTW-aangifte werkt: voorbereiden → controleren → exporteren naar jou of accountant
- Wat automatisch gaat vs. wat jij controleert
- Wat AI doet = suggesties, jij keurt goed
- Disclaimer: gebruiker blijft eindverantwoordelijk
- Toeslagen = indicatie, definitief oordeel bij Belastingdienst

**Nieuwe pagina `/about`** (`src/pages/About.tsx`):
- Korte oprichtersmissie (plek-houder copy + foto-placeholder)
- "Waarom we Cash Maatje bouwen"
- KvK-nummer + contact placeholder

**Trust-line onder hero**: "Eerste maand gratis · Geen creditcard · AVG-proof · EU-hosting · Altijd opzegbaar"

## Prioriteit 2 — Nep social proof weg

In `src/pages/Landing.tsx`:
- Fake logo's ACME/NORTHWIND/GLOBEX/INITECH/HOOLI verwijderen
- "4.9 · 320+ reviews" verwijderen
- Vervangen door: **"Momenteel in private beta met Nederlandse ondernemers"**
- Badge: "Gebouwd voor Nederlandse zzp'ers en kleine BV's"

## Prioriteit 3 — Claims juridisch veiliger

**Hero subtekst**:
> "Facturen, bonnen, BTW en financiële inzichten automatisch op één plek. CashMaatje helpt Nederlandse ondernemers grip te houden op hun geld — zonder spreadsheetstress."

**Toeslagencheck**:
- Sub-claim: "Krijg binnen enkele seconden een **indicatie** van mogelijke toeslagen. De definitieve beoordeling gebeurt altijd via de Belastingdienst."
- CTA "Direct aanvragen" → **"Aanvraag voorbereiden"**
- Per resultaatkaart "indicatie"-label + bron-link naar Belastingdienst

**AI-assistent voorbeeld** met controle-toon:
- Oud: "Ik heb dit al gereserveerd op je tax-account"
- Nieuw: "Je BTW-reserve staat €1.240 onder je verwachte verplichting. **Wil je dit bedrag reserveren?**" + Bevestig / Later knoppen

**Woordkeus** in hele landing:
- "Belastingen automatisch geregeld" → "Belastingvoorbereiding automatisch bijgehouden"
- "BTW-aangiftes" → "voorbereiden en exporteren naar jou of je accountant"
- "Jaarrekening / VPB / audit dossier" alleen noemen als **voorbereiding + AI-audit-scan voor accountant**

## Prioriteit 4 — Pricing: 2 plannen ZZP / BV

Pricing-sectie + referral-blok gemengd zoals nu, maar twee tiers:

**ZZP — €25,99/mnd**
- Onbeperkt facturen & bonnen (UBL + PDF)
- Bankkoppeling (PSD2)
- AI-categorisatie (suggesties, jij keurt goed)
- BTW-overzicht + aangifte voorbereiden
- Toeslagencheck (indicatie + aanvraag voorbereiden)
- Export naar accountant
- E-mailsupport

**BV — €49/mnd**
- Alles uit ZZP
- ICP-opgave voorbereiden
- VPB-voorbereiding (export naar accountant)
- Jaarrekening-voorbereiding (export naar accountant)
- **AI-auditscan**: AI-controle van je boekjaar, exporteerbaar naar accountant
- Holding / werkmaatschappij ondersteuning
- Accountant-toegang met rollen
- API + SSO
- Prioriteit support

Onder beide kaarten een regel: *"We bereiden voor en exporteren — de definitieve aangifte/jaarrekening blijft de verantwoordelijkheid van jou of je accountant."*

Referral-korting blijft beschikbaar op beide plannen.

## Prioriteit 5 — Productfuncties concreter

Per module concrete copy + koppelingen:

- **Facturatie** — UBL & PDF, betaallinks via Mollie/Stripe, automatische herinneringen, KOR-ondersteuning
- **Bonnen & kosten** — "Upload of mail je bon. CashMaatje leest leverancier, bedrag, BTW en categorie automatisch uit. Jij keurt alleen nog goed." Koppeling: e-mail inbox + mobiele upload
- **Live dashboard** — Bankkoppeling via PSD2 (ING, Rabobank, ABN, Knab, bunq, Revolut), realtime cashflow
- **Belasting-reserve** — Automatische BTW + IB-reserveberekening, jij bevestigt elke verplaatsing

Onder de modules een logo-rij van **echte** integraties: "Werkt met: ING · Rabobank · ABN · Knab · bunq · Mollie · Stripe · Shopify · UBL-export · Exact-export"

---

## Technisch overzicht

- **Nieuwe files**: `src/pages/Security.tsx`, `src/pages/Compliance.tsx`, `src/pages/About.tsx`
- **Routes** in `src/App.tsx`: `/security`, `/compliance`, `/about`
- **Aanpassen**: navigation-component, `src/pages/Landing.tsx` (hero, social proof, modules, AI-assistent voorbeeld, toeslagencheck copy, pricing-sectie)
- Origin design-tokens hergebruiken — geen nieuwe kleuren
- Footer-links toevoegen naar Security / Compliance / Over ons
- Geen backend- of schema-wijzigingen