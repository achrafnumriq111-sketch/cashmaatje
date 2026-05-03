## Doel

1. Gebruiker automatisch uitloggen na **10 minuten inactiviteit**.
2. Na klikken op "Uitloggen" moet de browser **niet** via de terug-knop een ingelogde pagina kunnen tonen (geen gecachete authed view).

## Aanpak

### 1. Inactivity timer (10 min)

Nieuwe hook `src/hooks/useIdleLogout.ts`:
- Luistert naar events: `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`, `visibilitychange`.
- Reset een timer (10 min = 600.000 ms) bij elke activiteit, met throttle (max 1x per 5s) om performance te sparen.
- Bij timeout: toon een toast ("Uitgelogd wegens inactiviteit"), roep `signOut()` aan, en navigeer naar `/`.
- Synchroniseert tussen tabs via `localStorage` key `arcory:lastActivity` + `storage` event, zodat activiteit in tab A ook tab B's timer reset.
- Optioneel: 30 sec voor timeout een waarschuwing-toast met "Blijf ingelogd"-knop (sla over als te complex; alleen toast bij logout).

Inhaken in `AuthProvider` (`src/lib/auth.tsx`) zodat hij automatisch actief is wanneer er een sessie is — alleen starten als `session` bestaat, opruimen als sessie weg is.

### 2. Harde logout (back-button bypass voorkomen)

Aanpassingen in `src/lib/auth.tsx` `signOut`:
```
- await supabase.auth.signOut({ scope: 'local' })
- Wis lokale state direct (setSession(null))
- Wis sessionStorage en relevante localStorage-keys (sb-* tokens worden door signOut gewist; dubbel checken)
- window.location.replace('/') i.p.v. navigate — vervangt history-entry zodat "vorige" terug naar /landing of /login gaat, niet naar de authed pagina
```

In `TopHeader.tsx` (en eventuele andere logout-knoppen zoals `Index.tsx`): laat de signOut-call de redirect doen via `window.location.replace('/')`. Verwijder eventuele `navigate(...)` calls die ervoor zorgen dat de history nog een authed-entry bevat.

Cache-control op authed pagina's:
- Voeg in `index.html` een `<meta http-equiv="Cache-Control" content="no-store">` toe — voorkomt dat browsers de bfcache (back-forward cache) gebruiken voor authed views.
- Plus in `AppLayout.tsx` een `useEffect` die luistert naar `pageshow` event: als `event.persisted === true` (pagina kwam uit bfcache) en er is geen sessie meer → `window.location.replace('/')`.

### 3. ProtectedRoute hardening

`src/lib/auth.tsx` `ProtectedRoute`:
- Vervang `navigate("/", { replace: true })` door `window.location.replace("/")` zodat de history-entry van de authed pagina volledig vervangen wordt en bfcache niet helpt.

## Bestanden

- **Nieuw**: `src/hooks/useIdleLogout.ts`
- **Edit**: `src/lib/auth.tsx` — idle hook inhaken in `AuthProvider`, `signOut` hard maken, `ProtectedRoute` redirect verharden
- **Edit**: `src/components/layout/AppLayout.tsx` — `pageshow` bfcache guard
- **Edit**: `index.html` — `Cache-Control: no-store` meta tag
- **Edit**: `src/components/layout/TopHeader.tsx` & `src/pages/Index.tsx` — logout flow gebruikt nieuwe `signOut` (geen extra navigate nodig)

## Acceptatie

- Niets doen voor 10 min → automatisch uitgelogd, redirect naar `/`, toast getoond.
- Activiteit in een andere tab voorkomt logout in beide tabs.
- Klik "Uitloggen" → land op `/` (landing). Browser "vorige" → blijft op `/` (of forceert opnieuw redirect), nooit een ingelogde pagina zichtbaar.
