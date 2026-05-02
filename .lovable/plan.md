
# Fixes voor punten_02052026.docx

11 punten gevonden in het feedback-document. Hier is wat er nog niet werkt en hoe ik het ga fixen.

## Pagina 1 — Cut the CHAOS

### 1. "Moet weg" — knop in Cut the Chaos verwijderen
De screenshot toont een element ("Pakket voor boekhouder") dat weg moet uit `FixTheChaos.tsx`. → Verwijderen.

### 2. Bank-CSV upload werkt niet vanuit Transacties
De "Import" knop opent `CsvImportModal`, maar die accepteert geen CAMT.053/MT940. We hebben de nieuwe parser al gemaakt in `BankImport.tsx` — fix is de "Import" knop in Transacties laten doorlinken naar `/bank/import` (de uitgebreide importpagina), zodat alle 3 formaten werken.

## Pagina 2 — Salarisoverzicht

### 3. Module-grid voelt als duplicaat van BTW-pagina
De huidige 8 module-cards staan los van de KPI's bovenin → wordt rommelig. → Modules consolideren in één duidelijk gegroepeerde sectie ("Aftrekposten" / "Inkomsten" / "Privé") met visuele scheiding, en de KPI-bar verkleinen.

### 4. "Unauthorized?" 
Komt waarschijnlijk uit een hook die een tabel zonder org_id-filter raakt. → Onderzoek welke hook (`useDeductiblePremiums`, `useCompanyCar`, `useMortgageDeduction`) faalt en fix de query/RLS.

## Pagina 3 — Financial Intelligence

### 5. "Unauthorized" + reageert niet op kosten
De `useFinancialInsights` edge function kan falen wanneer er geen kosten zijn. → Edge function defensief maken: bij lege data toch een AI-respons geven ("nog geen kosten geboekt — voeg eerst transacties toe"), en auth-token correct doorsturen.

### 6. Memoriaalboeking-knop in Scenario Simulator
Onder "Geprojecteerde winst" een knop "Memoriaalboeking maken" toevoegen die `MemorialJournalDialog` opent (component bestaat al).

## Pagina 4 — Contract Intelligence

### 7. PDF/DOCX upload werkt niet
Nu accepteert `ContractIntelligence.tsx` alleen `.txt`. → Toevoegen: client-side extractie van PDF (via `pdfjs-dist`) en DOCX (via `mammoth`), beide al makkelijk in browser bruikbaar zonder backend.

## Pagina 5 — Compliance Check & Theme Studio

### 8. "KVK API nodig"
KVK edge function bestaat al (`lookup-kvk`). De waarschuwing komt van Compliance Check pagina. → Pagina koppelen aan dezelfde `lookup-kvk` edge function en de "API nodig" placeholder vervangen door werkende lookup.

### 9. Theme Studio: thema's te donker / te vergelijkbaar
6 thema's zijn allemaal donker met emerald-achtige accent. → Vervangen met meer diverse opties:
- **Cash Maatje Dark** (huidige default)
- **Arctic Light** (echt licht thema, witte achtergrond)
- **Midnight Blue** (donkerblauw, koel)
- **Sunset** (warm oranje/roze accent op donker)
- **Forest** (groen op donker)
- **Mono Pro** (grijstinten, geen accent)

### 10. Bulk instellingen: alleen BTW-sliders, geen andere
Pagina heet "Bulk instellingen" en suggereert dat je alle settings tegelijk kan aanpassen. Nu alleen BTW. → Tabs uitbreiden met:
- BTW (bestaand)
- **Boekjaar** (fiscaal jaarstart maand)
- **KOR-status** (eligible toggle)
- **Branding** (logo/kleuren overerven van hoofdorg)

## Pagina 6 — Floating buttons

### 11. Feedback-button + andere FAB's zitten in de weg
Er is een floating feedback-knop linksonder die actie-knoppen overlapt. → Positie verplaatsen naar rechtsboven of inklappen tot icon-only.

---

## Uitvoeringsvolgorde

| Batch | Punten | Geschatte impact |
|---|---|---|
| **A — Quick wins** | 1, 2, 6, 11 | Direct zichtbaar, kleine edits |
| **B — Auth/data fixes** | 4, 5, 8 | Functionele blockers wegnemen |
| **C — UX herontwerp** | 3, 9, 10 | Layout & opties verbeteren |
| **D — File parsing** | 7 | PDF/DOCX support contract intelligence |

Doel: alle 11 punten in één implementatieronde af. Ik begin met A → B → C → D zodra je akkoord geeft.

## Vraag aan jou
Akkoord met deze 11 fixes in deze volgorde, of wil je iets anders prioriteren / een punt overslaan?
