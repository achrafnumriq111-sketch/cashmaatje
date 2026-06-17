## Doel
Verkoopfacturatie van "interne tool" naar "klant-klaar" brengen. Vijf gaps tegelijk dichten.

## 1. Factuur via e-mail versturen
- Nieuwe edge function `send-invoice-email` (Lovable Emails queue).
- React Email template `invoice-sent.tsx`: branded mail met PDF attachment-link (signed URL naar Storage), factuurnummer, totaal, vervaldatum, betaal-knop (links naar betaallink uit punt 3 als die er is).
- Knop **"Mailen naar klant"** in `InvoicesTable` + factuur detail; vult onderwerp/bericht voor, gebruiker kan aanpassen, klikt verzenden.
- Status van factuur springt automatisch van `draft` → `sent`, `sent_at` timestamp ingevuld.
- Log in `invoice_reminders_sent` met type `initial`.

## 2. UBL 2.1 / Peppol XML export
- Nieuwe util `src/lib/ublExport.ts`: genereert UBL 2.1 Invoice XML conform NLCIUS profiel (verplicht NL 2026).
- Velden: supplier (org KvK/BTW), customer, invoice lines met BTW-codes (S=21%, AA=9%, Z=0%, E=vrijgesteld, AE=verlegd), totals, betaalinstructies (IBAN).
- Knop **"Download UBL"** naast bestaande PDF-knop in InvoicesTable + bulk download als ZIP.
- Geen Peppol-verzending zelf — alleen XML voor klant/accountant/Peppol-access-point.

## 3. Betaallinks (Stripe)
- `payments--create_product` + price per factuur is overkill. Gebruik dynamic pricing (`price_data`) per factuur.
- Nieuwe edge function `create-invoice-payment-link` (`verify_jwt = false`): krijgt `invoice_id`, resolveert factuur server-side, maakt Stripe Checkout Session met `price_data` (totaalbedrag, EUR, omschrijving "Factuur F2025-003"), `metadata.invoice_id`.
- Webhook handler (uitbreiding bestaande Stripe webhook of nieuwe `stripe-invoice-webhook`): bij `checkout.session.completed` met `metadata.invoice_id` → markeer factuur `paid`, vul `payment_link` op factuur.
- Knop **"Genereer betaallink"** op factuur; link wordt opgenomen in e-mail template + PDF footer.
- Vereist Stripe go-live keuze — voor nu Stripe sandbox; user moet `enable_stripe_payments` runnen via Cloud → Payments.

## 4. Instelbare factuurnummering
- DB migration: voeg op `organizations.settings` JSON velden `invoice_prefix` (bv `F`), `invoice_number_format` (bv `{prefix}{year}-{seq:3}`), `invoice_yearly_reset` (bool), `invoice_next_seq` (int) toe.
- Nieuwe SQL functie `next_invoice_number(p_org_id)` SECURITY DEFINER met advisory lock — voorkomt duplicate nummers bij concurrent inserts. Bouwt nummer uit format, increment teller, reset bij jaarwissel als enabled.
- `SalesInvoiceForm` roept deze functie aan bij aanmaken (niet meer client-side timestamp).
- Settings-pagina sectie **"Factuurnummering"**: prefix, format-preview, jaarreset-toggle, volgende nummer (read-only).

## 5. Auto-paid via reconciliatie
- Bestaande `update_invoice_paid_amount` trigger doet dit al voor `payment_allocations`.
- Toevoegen: trigger `auto_match_bank_to_invoice` op `bank_transactions` insert. Probeert bedrag + (factuurnummer in description OR counterparty-iban match) te matchen. Bij match → maak `payment_allocations` row → bestaande trigger maakt status `paid`.
- Match-confidence opslaan; alleen auto-allocate bij ≥0.9, anders suggestion in reconciliatie-UI (bestaat al).

## Technische scope
- 2 edge functions: `send-invoice-email`, `create-invoice-payment-link`.
- 1 React Email template: `invoice-sent.tsx`.
- 1 utility: `ublExport.ts`.
- 1 migration: numbering kolommen + `next_invoice_number()` + `auto_match_bank_to_invoice()` trigger.
- UI: knoppen in `InvoicesTable`, sectie in `Settings.tsx`.
- Lovable Emails infra controle: als nog niet geïnstalleerd, `setup_email_infra` draaien (DNS niet vereist voor scaffolding).

## Out of scope nu
- Echte Peppol-verzending (vereist access point partner zoals Storecove/Tradeshift).
- Mollie als alternatief (Stripe genoeg voor MVP).
- Automatische incasso / SEPA direct debit.
- iDEAL als losse methode (zit al in Stripe).

## Volgorde van uitvoering
1. Migration (nummering + auto-match trigger)
2. Email infra check + `send-invoice-email` + template
3. UBL export utility + knoppen
4. Stripe betaallink edge function + webhook uitbreiding
5. Settings UI voor nummering
6. Smoke test elke flow

## Wat de gebruiker daarna nog moet doen
- Stripe activeren via Cloud → Payments (sandbox eerst, later go-live).
- Email-domein DNS verifiëren (al genoemd, gepland voor later).
- KvK/BTW-nummer invullen in org-instellingen zodat UBL geldig is.
