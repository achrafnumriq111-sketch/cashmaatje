import { LegalLayout, Block } from "./LegalLayout";
import { Lock, Server, ShieldCheck, FileCheck2, Users, Database, KeyRound, Mail } from "lucide-react";

export default function Security() {
  return (
    <LegalLayout
      eyebrow="SECURITY"
      titleA="Vertrouwd"
      titleB="met je financiële data."
      intro="Cash Maatje is gebouwd op de veiligheidsprincipes die je verwacht van een serieus financieel product. Hieronder lees je in mensentaal hoe we je gegevens beschermen."
    >
      <Block title="Data-isolatie per bedrijf">
        <p>
          Elk bedrijf in Cash Maatje heeft een strikt gescheiden dataset. We gebruiken row-level security op
          databaseniveau: geen enkel verzoek kan data van een ander bedrijf opvragen, ook niet per ongeluk. Iedere
          query wordt afgedwongen tegen jouw organisatie-ID.
        </p>
      </Block>

      <Block title="Encryptie at rest en in transit">
        <div className="flex gap-3"><Lock className="w-5 h-5 text-bone shrink-0 mt-0.5" strokeWidth={1.5} /><p>
          Al je data is versleuteld op disk (AES-256) en in transit (TLS 1.3). Wachtwoorden worden gehasht met
          Argon2/Bcrypt. Documenten in opslag zijn versleuteld met aparte sleutels per bucket.
        </p></div>
      </Block>

      <Block title="EU-hosting en AVG / GDPR">
        <div className="flex gap-3"><Server className="w-5 h-5 text-bone shrink-0 mt-0.5" strokeWidth={1.5} /><p>
          Alle data wordt gehost op servers binnen de Europese Unie. We verwerken persoonsgegevens conform de
          AVG/GDPR. Je hebt recht op inzage, correctie en verwijdering. Een verwerkersovereenkomst is op aanvraag
          beschikbaar.
        </p></div>
      </Block>

      <Block title="Dagelijkse back-ups">
        <div className="flex gap-3"><Database className="w-5 h-5 text-bone shrink-0 mt-0.5" strokeWidth={1.5} /><p>
          Dagelijkse versleutelde back-ups met 30 dagen retentie. Geografisch gescheiden van de productie-omgeving.
          We testen periodiek of we daadwerkelijk kunnen herstellen.
        </p></div>
      </Block>

      <Block title="Audit logs">
        <div className="flex gap-3"><FileCheck2 className="w-5 h-5 text-bone shrink-0 mt-0.5" strokeWidth={1.5} /><p>
          Elke wijziging in je administratie wordt geregistreerd: wie, wanneer, wat. Audit logs zijn niet
          aanpasbaar achteraf en exporteerbaar voor je accountant of voor een AVG-verzoek.
        </p></div>
      </Block>

      <Block title="Rollen & rechten">
        <div className="flex gap-3"><Users className="w-5 h-5 text-bone shrink-0 mt-0.5" strokeWidth={1.5} /><p>
          Werk samen met collega's of je accountant via fijnmazige rollen: eigenaar, medewerker, alleen-lezen of
          accountant. Toegang per module instelbaar. Twee-factor authenticatie beschikbaar voor alle accounts.
        </p></div>
      </Block>

      <Block title="Wij trainen geen AI-modellen op jouw klantdata">
        <div className="flex gap-3"><ShieldCheck className="w-5 h-5 text-bone shrink-0 mt-0.5" strokeWidth={1.5} /><p>
          AI-functies zoals bonherkenning en categorisatie draaien op je eigen data, maar we gebruiken die data
          nooit om onze of externe modellen te trainen — tenzij je daar expliciet toestemming voor geeft.
        </p></div>
      </Block>

      <Block title="Toegangscontrole en sleutels">
        <div className="flex gap-3"><KeyRound className="w-5 h-5 text-bone shrink-0 mt-0.5" strokeWidth={1.5} /><p>
          API-sleutels en bankkoppelingen (PSD2) zijn read-only tenzij je expliciet uitgaande betalingen activeert.
          Sleutels worden versleuteld opgeslagen en zijn intrekbaar vanuit je dashboard.
        </p></div>
      </Block>

      <Block title="Vragen of incident melden">
        <div className="flex gap-3"><Mail className="w-5 h-5 text-bone shrink-0 mt-0.5" strokeWidth={1.5} /><p>
          Heb je een security-vraag of vermoed je een kwetsbaarheid? Mail{" "}
          <a href="mailto:security@cashmaatje.com" className="text-bone underline underline-offset-2 decoration-white/30 hover:decoration-white/70">
            security@cashmaatje.com
          </a>
          . We reageren binnen 1 werkdag.
        </p></div>
      </Block>
    </LegalLayout>
  );
}
