## Doel

Voorkomen dat een brief die uit meerdere pagina's bestaat (Belastingdienst, deurwaarder, UWV, gemeente) als losse chaos-items in de lanes verschijnt. Vandaag geldt: 1 upload = 1 `chaos_items`-rij. Iemand die een naheffingsaanslag van 4 pagina's fotografeert krijgt dus 4 losse "acties", allemaal met verschillende panic scores en deadlines. Dat is precies de chaos die we oplossen willen — niet reproduceren.

## Aanpak in 3 lagen

### Laag 1 — Handmatig groeperen bij upload (direct duidelijk)

In `ChaosUploadZone`: als de gebruiker meerdere bestanden tegelijk selecteert of dropt, verschijnt een tussenscherm:

```text
Je hebt 4 bestanden geselecteerd. Horen ze bij hetzelfde document?
  (•) Ja, dit is 1 brief van meerdere pagina's
  ( ) Nee, aparte documenten
  ( ) Slim splitsen — laat AI het bepalen
```

Bij "1 brief" worden de bestanden client-side samengevoegd tot 1 multi-page PDF (via `pdf-lib`) en als 1 upload doorgestuurd. Bij "aparte" gedraagt het zich als nu. "Slim splitsen" gebruikt laag 3.

### Laag 2 — Multi-page PDF's correct verwerken (server)

`analyze-chaos-document` gaat er impliciet vanuit dat een PDF één document is, maar geeft de AI geen instructie om pagina-continuïteit te herkennen. Aanpassingen:

- Systeem-prompt uitbreiden: "Dit document kan meerdere pagina's bevatten. Behandel het als één geheel. Baseer titel, bedrag, deadline en risk timeline op alle pagina's samen; herhaal geen items."
- Tool krijgt een extra veld `page_count` (integer, informatief) zodat we in de UI kunnen tonen "Brief · 4 pagina's".
- Als Gemini de PDF niet kan lezen (fallback), splitsen we server-side met `pdf-lib` en sturen we de pagina's als aparte `image_url` entries binnen dezelfde tool-call — nog steeds 1 item.

### Laag 3 — Slim samenvoegen achteraf (AI grouping)

Voor het geval iemand pagina's afzonderlijk als foto's uploadt zonder ze te groeperen: na analyse van elke upload draait een dedupe-check op recente items van dezelfde organisatie (laatste 10 minuten).

Groeperingssignalen (alle moeten matchen, minimaal 2 sterke):
- Zelfde `sender_name` (fuzzy, Levenshtein < 3)
- Zelfde `reference_number` (kenmerk/aanslagnummer) — sterk signaal, alleen dit al is genoeg
- Zelfde `payment_deadline` én `amount_due`
- Uploads binnen 5 minuten van elkaar door dezelfde user
- Bestandsnamen met opeenvolgende nummering (`IMG_2341.jpg`, `IMG_2342.jpg`)

Bij match: nieuwe item wordt niet apart getoond maar gemerged in het bestaande item als extra pagina (`related_upload_ids` array, `page_count` +1). Panic score en deadline worden herberekend als max van alle pagina's. In de UI verschijnt op de card een chip "3 pagina's · samengevoegd" met een "Splits" actie voor false positives.

## Database

Migratie (kleine additieve wijziging, geen breaking changes):

```sql
alter table public.chaos_items
  add column if not exists page_count integer not null default 1,
  add column if not exists related_upload_ids uuid[] not null default '{}',
  add column if not exists grouping_reason text;  -- 'manual' | 'pdf' | 'ai_dedupe'
```

`chaos_uploads` krijgt geen wijziging — uploads blijven 1-op-1 met bestanden.

## UI

- `ChaosItemCard`: als `page_count > 1`, toon chip `📄 {n} pagina's` naast de titel en een klein "Splits" menu-item (verwijdert item, herstelt losse chaos_items uit `related_upload_ids`).
- `ChaosUploadZone`: nieuw tussenscherm bij ≥2 bestanden.
- `UploadStatusList`: toont "samengevoegd met bestaand item" wanneer laag 3 aanslaat, i.p.v. een nieuwe rij.

## Anti-fuzz / debug

- Alle groepering krijgt een `grouping_reason` zodat we in `ai_decisions`-log terug kunnen zien waarom pagina's samengevoegd zijn.
- Feature flag `chaos_smart_grouping` (default aan) om laag 3 uit te kunnen zetten bij problemen.
- Splits-actie logt naar `audit_log` — leert ons welke matches false positives waren.

## Wat NIET verandert

- Bestaande chaos_items en uploads blijven werken; `page_count=1` en lege `related_upload_ids` zijn de defaults.
- Panic score-, urgency- en risk-timeline-logica blijft identiek — alleen input verandert (1 document i.p.v. n).
- Geen wijziging aan `chaos_uploads` schema, storage buckets of RLS.

## Vragen voor ik bouw

1. Wil je bij multi-file drop ook een **preview** (thumbnails) tonen zodat de gebruiker ziet welke pagina's hij samenvoegt, of is een simpele radio-keuze genoeg?
2. Bij laag 3 (auto-merge): mag ik direct samenvoegen, of eerst een **notification** ("Wij denken dat deze 3 bij elkaar horen — bevestig") sturen voor bevestiging?
3. Tijdvenster voor auto-merge: **5 min** (strikt, alleen als je snel achter elkaar uploadt) of **1 uur** (soepeler, vangt ook trage uploaders)?
