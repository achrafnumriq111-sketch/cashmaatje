import { useState, useMemo } from "react";
import { Copy, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { ChaosItem, ActionType } from "@/hooks/useChaosData";
import { useChaosData } from "@/hooks/useChaosData";

type TemplateKey =
  | "payment_arrangement"
  | "delay_request"
  | "objection"
  | "accountant_email"
  | "supplier_payment_request"
  | "tax_delay";

const templateMeta: Record<TemplateKey, { label: string; actionType: ActionType }> = {
  payment_arrangement: { label: "Betalingsregeling aanvragen", actionType: "payment_arrangement" },
  delay_request: { label: "Uitstel van betaling", actionType: "delay_request" },
  objection: { label: "Bezwaarschrift", actionType: "objection" },
  accountant_email: { label: "E-mail aan accountant", actionType: "email_sent" },
  supplier_payment_request: { label: "Leverancier-betaalverzoek", actionType: "email_sent" },
  tax_delay: { label: "Uitstel Belastingdienst", actionType: "delay_request" },
};

function buildTemplate(key: TemplateKey, item: ChaosItem): string {
  const today = new Date().toLocaleDateString("nl-NL");
  const sender = item.sender_name ?? "Geadresseerde";
  const ref = item.reference_number ? `\nKenmerk: ${item.reference_number}` : "";
  const amount =
    item.amount_due != null
      ? `€${Number(item.amount_due).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`
      : "het openstaande bedrag";
  const deadline = item.payment_deadline ?? item.legal_deadline;

  switch (key) {
    case "payment_arrangement":
      return `Geachte heer/mevrouw,

Op ${today} ontving ik uw correspondentie inzake "${item.document_title}" (afzender: ${sender}).${ref}

Door tijdelijke liquiditeitsdruk is volledige betaling van ${amount}${
        deadline ? ` vóór ${new Date(deadline).toLocaleDateString("nl-NL")}` : ""
      } op dit moment niet haalbaar. Ik verzoek u vriendelijk een betalingsregeling toe te kennen in maandelijkse termijnen, ingaand vanaf de eerstvolgende maand.

Mocht u aanvullende informatie of onderbouwing wensen, dan lever ik die graag aan.

Met vriendelijke groet,
[Naam]
[Bedrijfsnaam] — [KvK]`;

    case "delay_request":
      return `Geachte heer/mevrouw,

Hierbij verzoek ik om uitstel van betaling voor "${item.document_title}".${ref}
Bedrag: ${amount}${deadline ? `\nOorspronkelijke deadline: ${new Date(deadline).toLocaleDateString("nl-NL")}` : ""}

Reden: tijdelijke liquiditeitskrapte. Verwachte betaaldatum: [DATUM].

Graag verneem ik uw bevestiging.

Met vriendelijke groet,
[Naam]`;

    case "objection":
      return `Geachte heer/mevrouw,

Hierbij maak ik formeel bezwaar tegen "${item.document_title}".${ref}

Onderbouwing:
1. [Feit 1]
2. [Feit 2]
3. [Feit 3]

Ik verzoek u de aanslag/beschikking te herzien en mij schriftelijk te informeren over de uitkomst.

Met vriendelijke groet,
[Naam]
[Bedrijfsnaam] — [KvK]`;

    case "accountant_email":
      return `Beste [Accountant],

Ik kreeg vandaag een document binnen waarvan ik graag wil dat je meekijkt:

Onderwerp: ${item.document_title}
Afzender: ${sender}${ref}
Bedrag: ${amount}${deadline ? `\nDeadline: ${new Date(deadline).toLocaleDateString("nl-NL")}` : ""}

Cash Maatje adviseert: ${item.recommended_action}

Kun jij dit binnen 2 werkdagen beoordelen en me adviseren over de juiste vervolgstap?

Bedankt,
[Naam]`;

    case "supplier_payment_request":
      return `Beste ${sender},

Bedankt voor je geduld. We zijn van plan om openstaande factuur "${item.document_title}"${
        ref ? ` (${item.reference_number})` : ""
      } binnen [X] dagen te voldoen.

Mocht je aanvullende informatie wensen, ik ben bereikbaar.

Met vriendelijke groet,
[Naam]`;

    case "tax_delay":
      return `Geachte Belastingdienst,

Hierbij verzoek ik om bijzonder uitstel van betaling voor onderstaande aanslag:

Document: ${item.document_title}${ref}
Bedrag: ${amount}${deadline ? `\nDeadline: ${new Date(deadline).toLocaleDateString("nl-NL")}` : ""}

Reden: tijdelijke liquiditeitsproblemen door [omschrijving]. Ik verwacht uiterlijk [DATUM] aan mijn betalingsverplichting te kunnen voldoen.

Graag verneem ik uw reactie.

Met vriendelijke groet,
[Naam]
BSN/RSIN: [...]
[Bedrijfsnaam] — [KvK]`;
  }
}

interface Props {
  item: ChaosItem;
}

export function OneClickTemplates({ item }: Props) {
  const { logAction } = useChaosData();
  const [key, setKey] = useState<TemplateKey>("payment_arrangement");
  const text = useMemo(() => buildTemplate(key, item), [key, item]);
  const [draft, setDraft] = useState<string>(text);

  // reset when template changes
  const handleChange = (v: string) => {
    setKey(v as TemplateKey);
    setDraft(buildTemplate(v as TemplateKey, item));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <Select value={key} onValueChange={handleChange}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(templateMeta) as TemplateKey[]).map((k) => (
              <SelectItem key={k} value={k}>
                {templateMeta[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={14}
        className="font-mono text-xs"
      />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(draft);
            toast({ title: "Tekst gekopieerd" });
          }}
        >
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Kopieer
        </Button>
        <Button
          size="sm"
          onClick={() => {
            logAction.mutate({
              itemId: item.id,
              type: templateMeta[key].actionType,
              notes: `Template gebruikt: ${templateMeta[key].label}`,
              status: "done",
            });
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Markeer als verzonden
        </Button>
      </div>
    </div>
  );
}
