# Maandelijkse bank-CSV upload reminder

Doel: elke maand krijgt de klant automatisch een herinnering (in-app + e-mail) om een bankafschrift-CSV te uploaden in CashMaatje, zodat directe PSD2-koppeling niet nodig is.

## Wat er komt

**1. Instelling per organisatie**
- Nieuw blok in `Settings → Bank` (en zichtbaar in Onboarding stap "Bankrekeningen") met:
  - Toggle "Maandelijkse CSV-upload reminder"
  - Dag van de maand (default: 3e — na afsluiting vorige maand)
  - Extra ontvangers (optioneel, comma-separated)
- Opgeslagen in `organizations.settings.bank_csv_reminder = { enabled, day_of_month, extra_recipients[] }`.
- Default AAN voor nieuwe orgs.

**2. Reminder-logica**
- Reminder wordt overgeslagen als de org in de afgelopen 25 dagen ≥1 `bank_transactions` rij heeft geïmporteerd (via CSV of anders) — zo krijgt niemand een reminder als 'ie al up-to-date is.
- Anders: e-mail + in-app notification met directe link naar `/bank/import`.

**3. E-mailtemplate**
- Nieuwe `bank-csv-reminder` template in `supabase/functions/_shared/transactional-email-templates/`.
- Onderwerp: "Tijd om je bankafschrift te uploaden — {maand}"
- CTA "Upload je CSV" → `https://cashmaatje.com/bank/import`
- Korte uitleg per bank (ING/Rabo/ABN/Knab/bunq) hoe je de CSV downloadt.

**4. Cron job**
- Nieuwe edge function `send-bank-csv-reminders` die dagelijks draait.
- Selecteert orgs waar `settings.bank_csv_reminder.enabled = true` én `day_of_month = vandaag`.
- Per org: check laatste import, skip indien recent; anders enqueue email naar owner + extra_recipients + maak notification voor alle members.
- Idempotency key: `bank-csv-reminder-{org_id}-{YYYY-MM}` — nooit dubbel per maand.
- pg_cron: dagelijks 09:00 Europe/Amsterdam.

**5. In-app notification**
- Rij in `notifications` tabel met type `bank_csv_reminder`, deep-link naar `/bank/import`.
- Verschijnt in de bestaande InboxBell/NotificationPanel.

**6. Handmatige trigger**
- Knop "Verstuur nu een test-reminder" in Settings zodat de gebruiker de mail direct kan uitproberen.

## Technische details

- **Migratie**: geen nieuwe tabellen. Wel:
  - `send_bank_csv_reminder(org_id uuid)` SECURITY DEFINER RPC die de skip-check + enqueue doet, aanroepbaar vanuit de edge function met service role.
  - pg_cron schedule dat `net.http_post` doet naar de edge function.
- **Edge function** `send-bank-csv-reminders/index.ts`:
  - Loopt orgs waar reminder vandaag valt, roept `send-transactional-email` aan per ontvanger, insert in `notifications`.
- **Template registry** update (`registry.ts`) met nieuwe entry.
- **Settings UI**: nieuw tabblad-blok `BankCsvReminderPanel` in `src/components/settings/`.
- **Onboarding**: `StepBankrekeningen` krijgt onderaan een compacte toggle met dezelfde default, opgeslagen in dezelfde settings-key bij finish.

## Wat er NIET verandert

- Geen PSD2-koppeling of nieuwe providers.
- Bestaande CSV-import flow (`/bank/import`) blijft zoals hij is — reminder linkt er alleen naartoe.
- Geen wijziging aan `payment_reminders` (die zijn voor debiteuren, niet voor jezelf).

## Vragen voordat ik bouw

1. Default dag van de maand: **3e** ok, of liever **1e**?
2. Reminder naar **alleen owner** of naar **alle admins/accountants** van de org?
3. Ook een **push/browser-notification** naast e-mail + in-app bel, of voorlopig alleen die twee?
