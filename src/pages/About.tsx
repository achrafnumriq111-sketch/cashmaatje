import { LegalLayout, Block } from "./LegalLayout";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <LegalLayout
      eyebrow="OVER ONS"
      titleA="Waarom we Cash Maatje"
      titleB="bouwen."
      intro="Cash Maatje is gemaakt door en voor Nederlandse ondernemers. Geen accountancy-fabriek — een klein team dat boekhouden weer hanteerbaar wil maken."
    >
      <Block title="Onze missie">
        <p>
          Te veel ondernemers verliezen avonden, weekenden en rust aan administratie. Wij geloven dat boekhouden,
          BTW en belasting hoort te werken als een rustige autopilot — niet als een spreadsheet-marathon op de
          laatste dag van het kwartaal.
        </p>
        <p>
          Cash Maatje bouwt een financieel systeem dat met je meedenkt, je voorbereidt op aangiftes, en de
          besluiten bij jou (en je accountant) houdt.
        </p>
      </Block>

      <Block title="Het team">
        <p>
          We zijn een klein team van ondernemers, ontwikkelaars en fiscaal-deskundigen uit Nederland. We werken
          samen met onafhankelijke accountants om er zeker van te zijn dat wat we bouwen ook fiscaal klopt.
        </p>
        <p className="text-frost/70 italic text-body-sm">
          Foto's, namen en achtergronden van het team volgen op deze pagina zodra we uit private beta zijn.
        </p>
      </Block>

      <Block title="Onze principes">
        <ul className="list-disc pl-5 space-y-2">
          <li><span className="text-bone">Eerlijk</span> — geen verborgen kosten, geen gouden bergen.</li>
          <li><span className="text-bone">Veilig</span> — security en privacy zijn niet optioneel.</li>
          <li><span className="text-bone">Mensgericht</span> — AI is een hulp, jij houdt de controle.</li>
          <li><span className="text-bone">Nederlands</span> — gebouwd voor de fiscale realiteit van NL.</li>
        </ul>
      </Block>

      <Block title="Contact & bedrijfsgegevens">
        <p>
          <span className="text-bone">Cash Maatje B.V.</span><br />
          KvK-nummer: <span className="text-bone">volgt</span><br />
          BTW: <span className="text-bone">volgt</span><br />
          E-mail:{" "}
          <a href="mailto:hello@cashmaatje.com" className="text-bone underline underline-offset-2 decoration-white/30 hover:decoration-white/70">
            hello@cashmaatje.com
          </a>
        </p>
        <p className="pt-2">
          Vragen over security? <Link to="/security" className="text-bone underline underline-offset-2 decoration-white/30 hover:decoration-white/70">Lees onze security-pagina</Link>.
          Vragen over compliance? <Link to="/compliance" className="text-bone underline underline-offset-2 decoration-white/30 hover:decoration-white/70">Lees hoe we met aangiftes omgaan</Link>.
        </p>
      </Block>
    </LegalLayout>
  );
}
