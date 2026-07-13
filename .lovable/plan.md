# Pre-launch checklist Cash Maatje

Overzicht van wat er nog ontbreekt voordat we publiek live kunnen. Gegroepeerd naar prioriteit — P0 = blocker voor launch, P1 = binnen 2 weken na launch, P2 = nice-to-have.

## P0 — Blockers (moet af vóór eerste betalende klant)

**1. Juridisch & compliance**

- Algemene voorwaarden (`/terms`) — nu ontbreekt de pagina helemaal
- Privacyverklaring (`/privacy`) — verplicht onder AVG, moet DPA-clausule bevatten
- Cookie/consent banner — nu geen consent flow voor analytics/tracking
- Verwerkersovereenkomst (DPA) als download voor zakelijke klanten
- Disclaimer op elke toeslag- en belastingberekening: "indicatief, geen fiscaal advies"

**2. Betalen & abonnement**

- Stripe subscription live zetten voor ZZP (€25,99) en BV (€49) — nu alleen invoice-payment-links
- Trial-flow (14 dagen?) + automatische conversie naar betaald
- Failed payment handling + dunning e-mails
- Customer portal knop in Instellingen (upgrade/downgrade/opzeggen)
- BTW op abonnement zelf (21%) correct factureren
- `payments--get_go_live_status` check + Stripe van test → live mode

**3. Auth & security hardening**

- E-mailverificatie verplicht vóór eerste login (nu mogelijk uit)
- Wachtwoord-reset flow end-to-end getest
- 2FA enrollment aanmoedigen voor accounts met financiële data
- Rate-limiting op login + 2FA endpoints
- RLS-audit: `security--run_security_scan` draaien en alle findings > low fixen
- Google OAuth redirect URIs voor production domain toevoegen

**4. E-mail deliverability**

- `email_domain--check_email_domain_status` — SPF/DKIM/DMARC voor cashmaatje.com verifiëren
- Alle transactionele templates (invoice-sent, bank-csv-reminder, welcome, password-reset) testen in Gmail/Outlook
- Unsubscribe-link werkend in marketing-achtige mails
- Bounce/complaint handling actief

**5. Onboarding productie-ready**

- Welcome-e-mail na registratie
- Empty states in dashboard als er nog geen data is (nu ziet nieuwe user lege grafieken)
- Sample-data optie of guided tour voor eerste sessie
- Foutafhandeling bij KvK-lookup als API down is

## P1 — Direct na launch

**6. Product-flows afmaken**

- PSD2 echte bankkoppeling (nu alleen mock via Psd2TestImport) — provider kiezen (Tink/Enable Banking/Ponto)
- OCR-kwaliteit meten op echte bonnen, fallback naar handmatige invoer
- UBL-export testen tegen echte accountantssoftware (Twinfield, Exact)
- BTW-aangifte definitief indienen richting Digipoort — nu alleen berekening

**7. Monitoring & support**

- Error tracking (Sentry of vergelijkbaar) op frontend + edge functions
- Uptime monitoring op kritieke edge functions
- Support-kanaal: e-mail ([support@cashmaatje.com](mailto:support@cashmaatje.com)) of intercom-achtig widget
- Status page
- Admin-dashboard voor jou om nieuwe klanten, MRR, churn te zien

**8. SEO & marketing basics**

- `robots.txt` + `sitemap.xml` genereren
- Meta tags per publieke pagina (title, description, og:image) — nu generiek
- Google Search Console + Analytics (met consent) koppelen
- Landing-page laadtijd meten (Lighthouse) en optimaliseren
- Referral-tracking end-to-end getest (link → registratie → korting)

**9. Content**

- FAQ-sectie op landing (top 10 vragen: veiligheid, opzeggen, accountant-toegang, migratie)
- Help-center / kennisbank met minimaal 15 artikelen (bank-CSV per bank, factuur maken, BTW-aangifte lezen, etc.)
- Video/GIF-demo van de belangrijkste flows in de landing

## P2 — Post-launch verbeteringen

- Mobile PWA install prompt
- iOS/Android native app of dedicated mobile receipt-scanner
- Accountant-portal uitbreiden met bulk-review
- Meertaligheid volledig (nu NL primair, EN gedeeltelijk)
- Whitelabel voor accountantskantoren
- API voor externe integraties

## Voorstel volgorde

Sprint 1 (deze week): P0 punt 1 (juridisch) + 3 (auth hardening) + 4 (e-mail deliverability).
Sprint 2 (volgende week): P0 punt 2 (Stripe subscription live) + 5 (onboarding).
Sprint 3: P1 punt 6 en 7.
Daarna soft-launch naar beta-lijst, feedback verzamelen, dan P1 8 en 9 voor publieke launch.

Wil je dat ik met Sprint 1 begin, of eerst dieper op één specifiek onderdeel inzoomen (bijv. Stripe subscription of juridische pagina's)?  
  
ja begin met sprint 1