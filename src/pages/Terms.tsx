import { LegalLayout, Block } from "./LegalLayout";

export default function Terms() {
  return (
    <LegalLayout
      eyebrow="ALGEMENE VOORWAARDEN"
      titleA="De afspraken"
      titleB="tussen jou en Cash Maatje."
      intro="Deze voorwaarden gelden voor iedereen die Cash Maatje gebruikt. Ze zijn opgesteld in gewone taal, zonder juridische omwegen waar dat kan."
    >
      <Block title="1. Wie is Cash Maatje?">
        <p>
          Cash Maatje is een online boekhoud- en fiscale automatiseringsdienst voor Nederlandse ondernemers,
          aangeboden door Cash Maatje B.V. (i.o.), gevestigd in Nederland. In deze voorwaarden noemen we onszelf
          "Cash Maatje" of "wij" en jou als klant "jij" of "gebruiker".
        </p>
        <p>
          Contact: <a className="text-bone underline" href="mailto:support@cashmaatje.com">support@cashmaatje.com</a>
        </p>
      </Block>

      <Block title="2. Wat bieden we aan?">
        <p>
          Cash Maatje is software waarmee je facturen maakt en ontvangt, bonnen verwerkt, banktransacties
          categoriseert, BTW-aangiftes voorbereidt en fiscaal inzicht krijgt. Cash Maatje is geen accountant en
          verstrekt geen bindend fiscaal of juridisch advies. Berekeningen zijn indicatief.
        </p>
      </Block>

      <Block title="3. Abonnement, prijs en betaling">
        <ul className="list-disc pl-5 space-y-2">
          <li>Abonnementen zijn maandelijks opzegbaar per de eerstvolgende factuurdatum.</li>
          <li>Prijzen staan op cashmaatje.com/pricing en zijn exclusief 21% BTW.</li>
          <li>Betaling gebeurt automatisch via Stripe. Bij mislukte betaling proberen we het opnieuw en
              waarschuwen we je per e-mail; blijft betaling uit, dan wordt de toegang na 14 dagen beperkt.</li>
          <li>Prijswijzigingen kondigen we minimaal 30 dagen van tevoren aan; je mag dan zonder kosten opzeggen.</li>
        </ul>
      </Block>

      <Block title="4. Proefperiode en eerste maand gratis">
        <p>
          Nieuwe accounts krijgen de eerste maand gratis. Er wordt geen betaalmethode gevraagd om te starten,
          tenzij anders vermeld. Na afloop start het gekozen abonnement automatisch tenzij je opzegt.
        </p>
      </Block>

      <Block title="5. Jouw verantwoordelijkheid">
        <ul className="list-disc pl-5 space-y-2">
          <li>Je zorgt voor juiste en volledige invoer van gegevens (bonnen, facturen, bankafschriften).</li>
          <li>Je controleert AI-suggesties en boekingen voor je ze definitief goedkeurt.</li>
          <li>Je blijft eindverantwoordelijk voor je aangifte richting de Belastingdienst — Cash Maatje bereidt
              alleen voor.</li>
          <li>Je beveiligt je account met een sterk wachtwoord en (bij voorkeur) tweefactor-authenticatie.</li>
        </ul>
      </Block>

      <Block title="6. Onze verantwoordelijkheid en aansprakelijkheid">
        <p>
          We doen er alles aan om de dienst betrouwbaar en veilig te leveren, maar we garanderen geen
          ononderbroken beschikbaarheid. Onze aansprakelijkheid is beperkt tot het bedrag dat je in de laatste
          12 maanden voor het abonnement hebt betaald. We zijn niet aansprakelijk voor gevolgschade,
          gemiste omzet, of foutieve aangiftes die voortkomen uit door jou verstrekte gegevens.
        </p>
      </Block>

      <Block title="7. Gegevens en privacy">
        <p>
          Cash Maatje verwerkt persoonsgegevens conform de AVG. Zie onze{" "}
          <a href="/privacy" className="text-bone underline">privacyverklaring</a>. Zakelijke klanten kunnen
          een verwerkersovereenkomst (DPA) opvragen via <a className="text-bone underline" href="mailto:privacy@cashmaatje.com">privacy@cashmaatje.com</a>.
        </p>
      </Block>

      <Block title="8. Opzeggen en dataportabiliteit">
        <p>
          Je kunt op elk moment opzeggen via Instellingen → Abonnement. Na opzegging bewaren we je data nog
          90 dagen zodat je hem kunt exporteren; daarna worden je gegevens verwijderd of geanonimiseerd,
          behoudens wettelijke bewaarplichten (in Nederland 7 jaar voor fiscale administratie).
        </p>
      </Block>

      <Block title="9. Wijzigingen">
        <p>
          We kunnen deze voorwaarden aanpassen. Belangrijke wijzigingen kondigen we minimaal 30 dagen van
          tevoren per e-mail aan. Blijf je gebruikmaken van Cash Maatje, dan aanvaard je de nieuwe voorwaarden.
        </p>
      </Block>

      <Block title="10. Toepasselijk recht">
        <p>
          Op deze overeenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de
          bevoegde rechter in Nederland.
        </p>
        <p className="pt-4 text-frost/70 text-caption">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}</p>
      </Block>
    </LegalLayout>
  );
}
