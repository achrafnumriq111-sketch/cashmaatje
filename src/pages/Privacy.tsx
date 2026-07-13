import { LegalLayout, Block } from "./LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout
      eyebrow="PRIVACYVERKLARING"
      titleA="Jouw data"
      titleB="blijft van jou."
      intro="Cash Maatje verwerkt persoonsgegevens conform de AVG. Deze verklaring legt uit welke data we verzamelen, waarom, hoe lang we die bewaren en welke rechten jij hebt."
    >
      <Block title="Wie is de verwerkingsverantwoordelijke?">
        <p>
          Cash Maatje B.V. (i.o.), gevestigd in Nederland. Contact voor privacyvragen:{" "}
          <a className="text-bone underline" href="mailto:privacy@cashmaatje.com">privacy@cashmaatje.com</a>.
        </p>
      </Block>

      <Block title="Welke gegevens verwerken we?">
        <ul className="list-disc pl-5 space-y-2">
          <li><span className="text-bone">Accountgegevens:</span> naam, e-mail, wachtwoord (gehasht), taalvoorkeur.</li>
          <li><span className="text-bone">Bedrijfsgegevens:</span> KvK-nummer, BTW-nummer, IBAN, factuuradres, logo.</li>
          <li><span className="text-bone">Financiële data:</span> facturen, bonnen, banktransacties, categorieën, BTW-berekeningen.</li>
          <li><span className="text-bone">Contacten:</span> klanten en leveranciers die je zelf toevoegt.</li>
          <li><span className="text-bone">Technische data:</span> IP-adres, browser-type, sessieduur (voor beveiliging en foutdetectie).</li>
        </ul>
      </Block>

      <Block title="Waarom verwerken we deze gegevens?">
        <ul className="list-disc pl-5 space-y-2">
          <li>Om de dienst te leveren (facturatie, boekhouding, aangiftevoorbereiding).</li>
          <li>Om je account te beveiligen (login, 2FA, fraudedetectie).</li>
          <li>Om te voldoen aan wettelijke verplichtingen (fiscale bewaarplicht).</li>
          <li>Om je te ondersteunen via e-mail wanneer je een vraag stelt.</li>
        </ul>
        <p>
          Grondslag: uitvoering overeenkomst (art. 6 lid 1 sub b AVG), wettelijke verplichting (sub c), en jouw
          toestemming voor optionele analytics.
        </p>
      </Block>

      <Block title="Met wie delen we data?">
        <p>Alleen met verwerkers die we nodig hebben om de dienst te leveren, onder verwerkersovereenkomst:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><span className="text-bone">Supabase / Lovable Cloud</span> — hosting en database (EU).</li>
          <li><span className="text-bone">Stripe</span> — betalingen (EU/VS met SCC).</li>
          <li><span className="text-bone">Mailgun / Resend</span> — e-mailverzending (EU).</li>
          <li><span className="text-bone">OpenAI / Anthropic (via Lovable AI Gateway)</span> — AI-suggesties voor categorisatie en documentverwerking. Data wordt niet gebruikt om modellen te trainen.</li>
        </ul>
        <p>We verkopen nooit data door aan derden.</p>
      </Block>

      <Block title="Hoe lang bewaren we data?">
        <ul className="list-disc pl-5 space-y-2">
          <li>Actieve accounts: zolang je klant bent.</li>
          <li>Na opzegging: 90 dagen exporteertermijn, daarna verwijdering.</li>
          <li>Financiële administratie: 7 jaar (fiscale bewaarplicht Belastingdienst).</li>
          <li>Loggegevens en beveiligingslogs: maximaal 12 maanden.</li>
        </ul>
      </Block>

      <Block title="Beveiliging">
        <p>
          Alle data wordt versleuteld verzonden (TLS 1.2+) en versleuteld opgeslagen (AES-256 at rest via de
          onderliggende cloud). Toegang is per organisatie afgeschermd met Row Level Security. We bieden
          tweefactor-authenticatie en versturen beveiligingsalerts bij verdachte activiteit. Meer details op
          onze <a href="/security" className="text-bone underline">Security-pagina</a>.
        </p>
      </Block>

      <Block title="Jouw rechten (AVG)">
        <ul className="list-disc pl-5 space-y-2">
          <li>Inzage, correctie en verwijdering van je gegevens.</li>
          <li>Dataportabiliteit — je kunt je administratie op elk moment exporteren.</li>
          <li>Bezwaar tegen verwerking en intrekking van toestemming.</li>
          <li>Klachtrecht bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).</li>
        </ul>
        <p>
          Verzoeken indienen kan via <a className="text-bone underline" href="mailto:privacy@cashmaatje.com">privacy@cashmaatje.com</a>.
          We reageren binnen 30 dagen.
        </p>
      </Block>

      <Block title="Cookies">
        <p>
          Cash Maatje gebruikt alleen functionele cookies die nodig zijn om ingelogd te blijven en
          voorkeuren te onthouden. Analytische of tracking-cookies plaatsen we pas na jouw expliciete
          toestemming via de cookie-melding onderin de website.
        </p>
      </Block>

      <Block title="Verwerkersovereenkomst (DPA)">
        <p>
          Zakelijke klanten kunnen een verwerkersovereenkomst opvragen via{" "}
          <a className="text-bone underline" href="mailto:privacy@cashmaatje.com">privacy@cashmaatje.com</a>.
          Deze wordt binnen 5 werkdagen digitaal aangeleverd.
        </p>
        <p className="pt-4 text-frost/70 text-caption">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}</p>
      </Block>
    </LegalLayout>
  );
}
