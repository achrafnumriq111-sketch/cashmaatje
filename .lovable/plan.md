## Probleem

In Google Authenticator (en andere TOTP-apps) verschijnt de entry met issuer "Lovable" in plaats van "Cashmaatje". Dit komt doordat de `otpauth://`-URI die Supabase Auth genereert een default `issuer=Lovable`-parameter bevat. Onze `friendlyName: "Cashmaatje ..."` zet alleen het account-label, niet de issuer (de grote vetgedrukte naam in de app).

## Oplossing: TOTP URI client-side herschrijven

In `src/pages/TwoFactorSetup.tsx` rewriten we de `data.totp.uri` voordat we hem naar QR-code omzetten:

- Parse de URI (`otpauth://totp/{label}?secret=...&issuer=...&...`)
- Vervang het `issuer=`-querystring-deel door `Cashmaatje`
- Vervang ook het label-pad-deel: van `Lovable:user@email` → `Cashmaatje:user@email`
- Genereer de QR-code op basis van de aangepaste URI

Voordeel: geen backend / dashboard-wijziging nodig, werkt onmiddellijk voor nieuwe enrollments.

`friendlyName` blijven we kort en netjes maken (gewoon `"Cashmaatje"` zonder timestamp; uniciteit is intern al gegarandeerd via `factorId`).

## Bestaande entries opruimen

De huidige "Lovable"-entry in jouw Google Authenticator kan niet remote worden bijgewerkt — TOTP-apps cachen labels lokaal. Wat jij moet doen:

1. Open je Google Authenticator en **verwijder de oude "Lovable"-entry** voor Cashmaatje
2. Ga in Cashmaatje naar **Instellingen → Beveiliging → 2FA opnieuw instellen** (of via de recovery flow)
3. Scan de nieuwe QR — die toont dan netjes **"Cashmaatje"**

Voor andere bestaande gebruikers geldt hetzelfde: pas zichtbaar bij re-enrollment.

## Bestand dat wijzigt

- `src/pages/TwoFactorSetup.tsx` — URI rewrite + nettere `friendlyName`

## Optioneel (later)

Als je ook de issuer aan de bron wilt fixen (zodat eventuele andere MFA-flows ook automatisch "Cashmaatje" tonen), kunnen we de project-naam in Lovable Cloud Auth-instellingen aanpassen. Dat is een dashboard-actie, geen code-wijziging.
