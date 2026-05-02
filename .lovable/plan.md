# Plan: Restafronding CashMaatje Repo Audit

## Status overzicht (22 punten)

### ✅ Afgerond in vorige loops (12)
- **1.1** TE BETALEN / TE ONTVANGEN labels
- **1.2** "BTW winst-aangifte" header
- **2.2** Contract Intelligence edge function (Wet DBA)
- **3.1** MileageLog (auto-classify + GPS) — al aanwezig
- **3.2** Urenregistratie pagina
- **3.3** Agenda pagina
- **3.5** Memoriaalboekingen (dialog + `post_memorial_journal` RPC)
- **3.9** Export Center — al aanwezig
- **RBAC** entity_roles + UsersAndRoles pagina + `useEntityAccess`
- **Accountant** shares (invite + token + expiry)
- **Uren → Factuur** bulk conversie
- **DB foundation** 9 nieuwe tabellen + RLS

### 🟡 Partial — moeten afgerond (5)
- **2.4** Salary/Payroll: pagina bestaat, maar berekening (loonheffing/SVW/WGA/ZVW tabellen 2026) ontbreekt
- **3.6** PayrollRuns: journaalpost-generatie per run ontbreekt
- **4.2** Cut the Chaos dashboard: bestaat maar oude widgets, geen actuele KPI's
- **VPB**: `vpb_calculations` tabel staat klaar, maar P&L data wordt nog niet gemapt
- **Bank Upload**: `bank_uploads` tabel klaar, UI flow (CAMT.053/MT940 → reconciliation) ontbreekt

### 🔴 Niet gestart (5)
- **2.1** KVK auto-fill bij contact creation (`kvk_companies` tabel klaar, geen edge function/UI)
- **2.3** Entity roles UI in contact-detail (rol per contact: klant/leverancier/aandeelhouder/etc.)
- **3.4** Contract → Wet DBA badge in contact lijst + auto-trigger bij upload
- **3.7** Quarterly Checklist auto-vink op basis van afgeronde acties
- **4.1** Onboarding wizard: branche-keuze → preset rekeningschema + BTW-instellingen

---

## Uitvoeringsplan (4 batches)

### Batch A — Financiële kern (eerst, hoogste impact)
1. **VPB-berekening** — edge function `calculate-vpb` haalt P&L op, past 2026 staffel toe (19% tot €200k, 25.8% daarboven), schrijft naar `vpb_calculations`. CorporateTax pagina toont resultaat.
2. **Payroll calculations + journal** — `process-payroll` edge function: bruto→netto met 2026 loonheffingstabellen, schrijft `payroll_runs` + auto journal entry (loonkosten Dt / netto te betalen Ct / loonheffing Ct).
3. **Cut the Chaos rebuild** — nieuwe widgets: openstaande BTW-deadline, ongelezen bonnetjes, ongekoppelde banktransacties, contracten zonder DBA-check, overdue facturen.

### Batch B — Contact intelligence
4. **KVK auto-fill** — edge function `lookup-kvk` (KVK Open Data API), trigger in Contacts dialog bij invoer KVK-nummer of bedrijfsnaam.
5. **Entity roles per contact** — UI in ContactDetail: meerdere rollen toekennen (klant, leverancier, aandeelhouder, DGA, accountant) via `entity_roles`.
6. **Wet DBA badge** — badge component op contact + auto-trigger `analyze-contract` bij contract-upload, status zichtbaar in lijst.

### Batch C — Bank & flow
7. **Bank Upload UI** — upload pagina voor CAMT.053/MT940, parser edge function, koppeling naar `bank_uploads` + auto-match tegen openstaande facturen in Reconciliation.
8. **Quarterly Checklist auto-progress** — checks op DB-state (BTW ingediend?, alle bonnen verwerkt?, reconciliation 100%?), automatisch afvinken.

### Batch D — Onboarding finetuning
9. **Onboarding branche-presets** — stap toevoegen: branche-keuze (ZZP-IT / Webshop / Horeca / Bouw / Holding) → preset chart of accounts + default BTW-codes + relevante widgets aan in dashboard.

---

## Volgorde & opleverstrategie

| Batch | Prompts | Onafhankelijk? | Gebruikerswaarde |
|-------|---------|----------------|------------------|
| A | 3 | Ja, parallel | Hoog (geld + overzicht) |
| B | 3 | Volgordelijk (KVK → roles → DBA badge) | Hoog (data quality) |
| C | 2 | KVK eerst voor matching helpful | Medium-hoog |
| D | 1 | Laatst | Medium |

Totaal: **9 implementatiestappen**, geschat in ~4 berichten te leveren als batches A en C parallel uitgevoerd worden waar mogelijk.

## Vraag aan jou
Mag ik in dit tempo doorwerken (Batch A → B → C → D, telkens kort statusbericht), of wil je per batch eerst review?