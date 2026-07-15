# Invoice Cashflow Pack + Mobile App Voorbereiding

## Deel 1 — Invoice Cashflow Pack (5 features)

### 1. Aging Report
Nieuwe pagina `/facturen/aging` onder Facturen in de sidebar.
- Buckets: Niet vervallen, 0–30, 31–60, 61–90, 90+ dagen
- Groepering per klant met totalen per bucket
- Kleurcodering: geel (31–60), oranje (61–90), rood (90+)
- Klik op klant → uitklap met losse facturen + "Herinnering sturen" / "Bel nu" knop
- Totaalregel onderaan met openstaand bedrag per bucket
- Export naar CSV en PDF (via bestaande `pdfExport` en `csvImport` utilities)

### 2. Client Statement PDF
Knop op `ContactDetail` → "Download klantstatement"
- Genereert PDF met álle facturen van die klant (betaald + open) over een gekozen periode
- Kolommen: Factuurnr, Datum, Vervaldatum, Bedrag, Betaald, Openstaand, Running balance
- Header met eigen huisstijl (logo, kleuren uit `BrandingPanel`)
- Footer met totaal openstaand + IBAN voor betaling
- Ook e-mail-versturen knop (via bestaande `send-invoice-email` edge function, aangepast)

### 3. Bulk-acties uitgebreid op facturenlijst
Uitbreiding van `InvoiceBulkActions`:
- Bulk "Markeer als betaald" (met datum-picker, maakt betaal-journaalpost per factuur)
- Bulk "Archiveer" (nieuw `archived` veld op invoices)
- Bulk "Verstuur herinnering" (voor overdue facturen)
- Bevestigings-dialog met samenvatting vóór uitvoeren

### 4. Archief-tab + auto-archive
- Nieuw `archived` (bool) + `archived_at` (timestamp) veld op `invoices`
- Extra tab "Archief" op SalesInvoices en PurchaseInvoices (standaard verborgen)
- Setting in `Settings → Facturatie`: "Auto-archiveer betaalde facturen na X maanden" (default: uit, opties 6/12/24 maanden)
- Dagelijkse cron edge function `auto-archive-invoices` die dit uitvoert per org
- Gearchiveerde facturen tellen NIET mee in aging report of dashboard-openstaand

### 5. Multi-currency dashboard widget
Nieuwe widget op `Dashboard`: "Openstaand per valuta"
- Groepeert open invoices op `currency` veld
- Toont per valuta: aantal facturen + totaal openstaand
- Alleen zichtbaar als er >1 valuta in gebruik is (anders geen ruis)
- Klik op valuta → filtert facturenlijst op die valuta

## Deel 2 — Mobiele app (na oplevering Deel 1)

Voor "iOS/Android app" zijn er 2 paden. Ik stel voor **Capacitor (native)** omdat je expliciet iOS/Android app zegt:

**Capacitor (aanbevolen voor jouw vraag):**
- Echte native app, publiceerbaar in App Store en Google Play
- Toegang tot camera (bon scannen), push notifications, biometric login (Face ID voor 2FA)
- Zelfde React codebase, wordt in native shell verpakt
- Vereist Mac + Xcode voor iOS build, Android Studio voor Android build
- Export naar GitHub nodig — bouwen kan niet in Lovable sandbox

**PWA alternatief (sneller, minder krachtig):**
- Werkt vandaag, geen app stores nodig
- Gebruikers "Voeg toe aan beginscherm" vanuit Safari/Chrome
- Beperkte camera/notification support op iOS
- Geen App Store distributie

Ik doe in deze sprint alleen **Capacitor setup**: config file, dependencies, hot-reload naar sandbox preview, en de instructies voor jou om lokaal te draaien. De 5 features werken automatisch mee omdat de codebase gedeeld is.

## Technische details

### Database migraties
```sql
ALTER TABLE invoices 
  ADD COLUMN archived boolean NOT NULL DEFAULT false,
  ADD COLUMN archived_at timestamptz;

CREATE INDEX idx_invoices_archived ON invoices(organization_id, archived);

ALTER TABLE organizations
  ADD COLUMN auto_archive_months integer;  -- null = uit
```

### Nieuwe files
- `src/pages/InvoiceAging.tsx` — aging report pagina
- `src/hooks/useInvoiceAging.ts` — bucket-berekening
- `src/lib/clientStatementPdf.ts` — PDF generator voor klantstatement
- `src/components/contacts/ClientStatementDialog.tsx` — dialog met periode-picker
- `src/components/dashboard/MultiCurrencyWidget.tsx`
- `supabase/functions/auto-archive-invoices/index.ts` — dagelijkse cron
- `capacitor.config.ts` — Capacitor config met hot-reload naar sandbox

### Uitgebreide files
- `src/components/invoices/InvoiceBulkActions.tsx` — nieuwe bulk-acties
- `src/pages/SalesInvoices.tsx` en `PurchaseInvoices.tsx` — Archief-tab
- `src/pages/Settings.tsx` — auto-archive setting
- `src/pages/Dashboard.tsx` — multi-currency widget
- `src/components/contacts/ContactDetail.tsx` — statement knop
- `src/components/layout/AppSidebar.tsx` — "Aging" link onder Facturen

### Cron
`pg_cron` job om 03:00 UTC → `auto-archive-invoices` edge function per org.

## Uitvoervolgorde
1. DB migratie (archived, auto_archive_months)
2. Aging report (pagina + hook + sidebar link)
3. Client statement PDF (dialog + generator + PDF export)
4. Bulk-acties uitbreiden
5. Archief-tab + settings + cron
6. Multi-currency widget op dashboard
7. Capacitor setup + config + instructies

Aan het eind: samenvatting + stappen die JIJ lokaal moet doen voor de iOS/Android build.
