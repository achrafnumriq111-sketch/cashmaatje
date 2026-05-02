
# Live gaan met Arcory — Plan

Goed nieuws: het project is **al gepubliceerd** op `cashmaatje.lovable.app` en op het custom domain `cashmaatje.com` (visibility: public). Technisch is de app dus al "live" bereikbaar.

Maar voordat we écht echte gebruikers + écht geld erop laten, moeten we eerst de **pre-launch checklist** afwerken. Uit de scans komen 58 backend-meldingen + een aantal openstaande functionele punten uit de audit.

## Wat er al staat
- Publish status: **public** ✅
- Custom domain `cashmaatje.com` actief ✅
- Lovable Cloud (database + auth + edge functions) actief ✅
- Volledige feature-set uit de audit grotendeels af (zie vorige overzicht)

## Wat we moeten fixen vóór live (must-have)

### 1. Backend security hardening (58 linter warnings)
De Supabase linter meldt:
- **1× INFO** — RLS aan zonder policy op een tabel → deze tabel is onbenaderbaar; moet policy krijgen of RLS uit
- **4× Function Search Path Mutable** — SQL functies missen `SET search_path = public` (security best practice)
- **1× Extension in Public** — extensie staat in `public` schema i.p.v. `extensions`
- **1× RLS Policy Always True** — overly permissive policy op een schrijfactie
- **1× Public Bucket Allows Listing** — storage bucket laat anonymous listing toe
- **23× Public Can Execute SECURITY DEFINER Function** — anon users kunnen interne functies aanroepen
- **19× Signed-In Users Can Execute SECURITY DEFINER Function** — ingelogde users kunnen functies aanroepen die alleen intern bedoeld zijn

Fix: één migratie die `REVOKE EXECUTE … FROM anon, authenticated` doet op alle interne RPC's, `SET search_path` toevoegt aan alle functies, de always-true policy aanscherpt, de storage bucket-policy aanpast en de open RLS-tabel een policy geeft.

### 2. Auth-instellingen productie-klaar
- Verifiëren dat email-confirmation aan staat (geen anonymous signups)
- Site URL en redirect URLs op `https://cashmaatje.com` zetten i.p.v. preview-URL
- Google OAuth redirect URIs checken voor productie domain

### 3. Email afzender op eigen domein
Auth-emails (signup confirm, password reset, magic link) moeten vanaf `@cashmaatje.com` verstuurd worden i.p.v. de Lovable default. Vereist DNS records (SPF/DKIM/DMARC) op het domein.

### 4. Resterende audit-punten (aanrader, geen blocker)
Uit de vorige loop staan nog open:
- Salary 2026 loonheffingstabellen (berekeningsengine)
- Cut the Chaos dashboard rebuild
- Wet DBA badge in contactlijst
- Quarterly Checklist auto-vink
- VPB P&L → calculations edge function

Deze blokkeren live gaan niet — de UI werkt, de berekeningen kunnen post-launch verfijnd worden.

## Wat we moeten besluiten (optioneel)

### 5. Betalingen (alleen als je geld wil ontvangen via Arcory)
Op dit moment is er **geen ingebouwde Stripe payments-flow** actief. Als gebruikers een abonnement moeten kopen binnen Arcory, zetten we Lovable Payments (Stripe) op — geen eigen Stripe account nodig.

### 6. Branding & badge
Op betaalde plannen kun je de "Edit with Lovable"-badge verbergen op je live site.

---

## Voorgestelde uitvoeringsvolgorde

| Stap | Wat | Blocker? |
|---|---|---|
| 1 | SQL migratie: search_path + REVOKE EXECUTE + RLS-fixes (58 warnings → 0) | **Ja** |
| 2 | Auth Site URL + redirect URLs naar cashmaatje.com | **Ja** |
| 3 | Storage bucket policies aanscherpen | **Ja** |
| 4 | Linter opnieuw draaien — verifiëren dat alle warnings weg zijn | **Ja** |
| 5 | (Optioneel) Custom email domain instellen voor auth-mails | Nee |
| 6 | (Optioneel) Lovable Payments enablen voor abonnementen | Nee |
| 7 | (Optioneel) Resterende 5 audit-punten oppakken | Nee |
| 8 | Final publish/update | **Ja** |

Stappen 1–4 + 8 vormen het minimum voor verantwoord live gaan. Geschat in **1 batch** te leveren (één migratie + auth config update).

## Vraag aan jou
Wil je dat ik:
- **A)** Alleen de must-haves doe (1–4 + 8) → snelste route naar veilig live
- **B)** Must-haves + custom email domain (1–5 + 8) → professionele uitstraling vanaf dag 1
- **C)** Alles incl. payments + resterende audit-punten (1–8) → volledig productie-klaar, duurt langer

Welke optie?
