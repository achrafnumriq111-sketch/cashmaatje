## Doel

1. Na inloggen landt de gebruiker direct op **Corporate Structure** (i.p.v. Dashboard).
2. Gebruiker kan **entiteiten toevoegen** vanuit dat scherm.
3. Elke extra entiteit is een **add-on van €15,99/maand** (vaste prijs — referral-korting geldt hier NIET).
4. Hoofd-abonnement Cash Maatje (€25,99 met referral-korting) blijft ongewijzigd.

---

## 1. Landing-route wijzigen

`src/App.tsx`: de index-route binnen `<AppLayout />` wordt `<CorporateStructure />` i.p.v. `<Dashboard />`. Dashboard verhuist naar `/dashboard`. Sidebar-link voor "Corporate Structure" verwijst dan naar `/` en Dashboard naar `/dashboard`.

## 2. Database — entiteiten model

Nieuwe migration:

- Kolom `parent_organization_id uuid references organizations(id) on delete set null` toevoegen aan `organizations`. De huidige org wordt dan de "holding"; toegevoegde entiteiten hebben deze als parent.
- Kolom `entity_ownership_pct numeric(5,2) default 100.00` voor het organogram (optioneel veld in form).
- Nieuwe tabel `entity_addons`:
  - `id uuid pk`
  - `parent_organization_id uuid` (de hoofd-org / betalende org)
  - `child_organization_id uuid unique` (de extra entiteit)
  - `stripe_subscription_id text` (apart Stripe subscription voor deze add-on)
  - `stripe_subscription_item_id text` 
  - `status text` (active/canceled/past_due)
  - `current_period_end timestamptz`
  - `environment text default 'sandbox'`
  - timestamps
  - RLS: alleen leden van parent_organization_id mogen lezen; alleen owners mogen schrijven via edge function (service role).

## 3. Stripe product/prijs

Nieuw product `entity_addon` met price `entity_addon_monthly` à €15,99/maand (1599 cent EUR, recurring month, quantity 1-1). Aangemaakt via `payments--batch_create_product`. Tax code matchen met bestaand `cashmaatje` product (SaaS).

## 4. Frontend — Corporate Structure pagina

`src/pages/CorporateStructure.tsx` herschrijven naar live data:

- Hook `useEntities()` haalt huidige org op + alle child orgs (parent_organization_id = current org) + hun add-on subscription status.
- Organogram-cards komen uit DB (eigenaar = current user, holding = current org, subsidiaries = child orgs).
- "Entiteit toevoegen" knop → `AddEntityDialog`:
  - Form: naam, legal_name, kvk, btw, org_type, ownership %.
  - Toont badge "€15,99/maand extra — geen referral-korting van toepassing".
  - Submit → opent Stripe Embedded Checkout met price `entity_addon_monthly`, metadata `{ parentOrgId, entityDraft: {...} }`.
- Per child-org card: status-badge (Actief / Betaling vereist / Geannuleerd) en menu om te beheren / annuleren via portal.

## 5. Edge functions

**`create-entity-checkout`** (nieuw, `verify_jwt = false`):
- Input: `{ parentOrganizationId, entityDraft, environment, returnUrl }`.
- Auth: extract Bearer token → `supabase.auth.getUser` → check membership op parentOrg met `is_owner=true`.
- Maakt Checkout Session: `mode: subscription`, price `entity_addon_monthly`, `ui_mode: embedded_page`, `managed_payments: { enabled: true }`, metadata `{ parentOrgId, userId, entityDraft (JSON.stringify), addon_type: 'entity' }`. Géén coupon — referral-korting is hier niet van toepassing.
- Returnt `clientSecret`.

**`payments-webhook`** uitbreiden:
- Op `checkout.session.completed` met `metadata.addon_type === 'entity'`: parse `entityDraft`, maak nieuwe `organizations`-rij met `parent_organization_id = parentOrgId`, voeg de owner toe aan `organization_members` als owner, insert `entity_addons`-rij met de Stripe subscription gegevens.
- Op `customer.subscription.updated/deleted` met dezelfde metadata: update `entity_addons.status` + `current_period_end`.
- Belangrijk: bestaande Cash Maatje subscription handling NIET aanraken; gebruik metadata om addon-flow te onderscheiden.

## 6. Referral discount expliciet afschermen

In `_shared/referral-discount.ts` (recalculate function): alleen het hoofdabonnement `cashmaatje_monthly` krijgt korting. Add-on subscriptions worden expliciet overgeslagen. Frontend Pricing-pagina copy aanvullen: "Referral-korting geldt alleen op het hoofdabonnement, niet op extra entiteiten."

## 7. Subscription gating

`SubscriptionGate` blijft kijken naar Cash Maatje. Add-on niet-actief = entiteit blijft staan maar krijgt badge "Betaling vereist" en de child-org wordt niet als bruikbare org getoond in `OrgSwitcher`. Concreet: `useOrganization` filter — child orgs zonder actieve `entity_addons` row worden uitgesloten uit memberships-lijst.

## Bestandenlijst

Nieuw:
- `supabase/migrations/<ts>_entity_addons.sql`
- `supabase/functions/create-entity-checkout/index.ts`
- `src/hooks/useEntities.ts`
- `src/components/structure/AddEntityDialog.tsx`
- `src/components/structure/EntityCard.tsx`

Aanpassen:
- `src/App.tsx` (route swap)
- `src/components/layout/AppSidebar.tsx` (link Dashboard/Structure)
- `src/pages/CorporateStructure.tsx` (live data + add-knop)
- `src/pages/Pricing.tsx` (copy add-on toelichting)
- `src/hooks/useOrganization.ts` (filter inactieve entity-addons)
- `supabase/functions/payments-webhook/index.ts` (addon-tak)
- `supabase/functions/_shared/referral-discount.ts` (skip addons)
- `supabase/config.toml` (functions.create-entity-checkout verify_jwt=false)
- `src/lib/stripe.ts` (`ENTITY_ADDON_PRICE_ID` constante)

---

## Open vragen

Een paar puntjes wil ik bevestigd hebben voordat ik bouw:
