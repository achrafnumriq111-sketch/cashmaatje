import { LegalLayout, Block } from "./LegalLayout";

export default function PublicCompliance() {
  return (
    <LegalLayout
      eyebrow="COMPLIANCE & BOEKHOUDING"
      titleA="Hoe Cash Maatje"
      titleB="met jouw aangifte omgaat."
      intro="Transparant over wat we automatisch doen, wat jij controleert, en waar jouw verantwoordelijkheid begint."
    >
      <Block title="Wat doet Cash Maatje automatisch?">
        <ul className="list-disc pl-5 space-y-2">
          <li>Bonnen automatisch inlezen en categoriseren (AI doet een suggestie).</li>
          <li>BTW per regel berekenen op basis van categorie en datum.</li>
          <li>Bankmutaties matchen met facturen en bonnen.</li>
          <li>Reserves voor BTW, IB en VPB realtime bijwerken.</li>
          <li>Aangiftes en jaarrekening voorbereiden in standaardformaten (XBRL, UBL, SBR).</li>
        </ul>
      </Block>

      <Block title="Wat moet jij (of je accountant) controleren?">
        <ul className="list-disc pl-5 space-y-2">
          <li>Of bonnen en facturen volledig en juist zijn geüpload.</li>
          <li>Of de AI-categorisatie klopt — jij keurt elke boeking definitief goed.</li>
          <li>Of de BTW-aangifte correct is voor je situatie (bv. KOR, ICP, reverse charge).</li>
          <li>Of bijzondere posten (privégebruik auto, woning-werk, afschrijvingen) juist staan.</li>
          <li>De definitieve indiening bij de Belastingdienst.</li>
        </ul>
      </Block>

      <Block title="Wat beslist AI wel en niet?">
        <p>
          AI in Cash Maatje doet <span className="text-bone">voorstellen</span> — het beslist nooit zelfstandig over
          fiscale verplichtingen, betalingen of verplaatsingen van geld. Elke financiële of fiscale actie vereist jouw
          expliciete bevestiging.
        </p>
        <p>
          Voorbeeld: AI stelt voor om een bon te boeken als "Kantoorbenodigdheden / 21% BTW". Jij keurt goed, past
          aan of weigert. AI verplaatst pas geld of stuurt pas een aangifte als jij de knop indrukt.
        </p>
      </Block>

      <Block title="BTW-aangifte: voorbereiden, exporteren, indienen">
        <p>
          Cash Maatje bereidt je BTW-aangifte voor in het juiste formaat en toont een controle-overzicht. Je kunt:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>De aangifte exporteren en zelf indienen via Mijn Belastingdienst Zakelijk.</li>
          <li>De aangifte exporteren naar je accountant (XAF / UBL / CSV).</li>
        </ul>
        <p>
          Officiële indiening namens jou via SBR is niet standaard inbegrepen — je accountant of jij blijft
          formeel verantwoordelijk voor de aangifte.
        </p>
      </Block>

      <Block title="Jaarrekening, VPB en AI-auditscan (BV-plan)">
        <p>
          Voor BV's bereidt Cash Maatje de jaarrekening en de VPB-aangifte voor en exporteert deze naar je
          accountant. Met de AI-auditscan controleert AI je boekjaar op inconsistenties, missende bonnen en
          opvallende posten. Het resultaat is exporteerbaar als auditdossier — jouw accountant houdt het laatste
          woord.
        </p>
      </Block>

      <Block title="Toeslagen: indicatie, geen besluit">
        <p>
          De toeslagencheck op de homepage geeft een <span className="text-bone">indicatie</span> op basis van
          publiek beschikbare Belastingdienst-thresholds. Geen rechten te ontlenen. De definitieve beoordeling en
          uitbetaling gebeurt altijd via de Belastingdienst. Cash Maatje helpt je de aanvraag voor te bereiden.
        </p>
      </Block>

      <Block title="Jouw verantwoordelijkheid">
        <p>
          Cash Maatje is een hulpmiddel. De gebruiker (of diens accountant) blijft eindverantwoordelijk voor de
          juistheid en tijdigheid van fiscale aangiftes en jaarrekeningen. We helpen je zo goed mogelijk
          voorbereiden, maar nemen geen wettelijke verantwoordelijkheid voor een onjuiste aangifte over.
        </p>
      </Block>
    </LegalLayout>
  );
}
