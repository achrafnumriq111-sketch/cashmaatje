import { OpeningBalanceImport } from "./imports/OpeningBalanceImport";
import { BankStatementImport } from "./imports/BankStatementImport";
import { ContactsImport } from "./imports/ContactsImport";
import type { OnboardingData } from "@/pages/Onboarding";

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

export default function StepImport({ data, setData }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Historische data importeren</h2>
        <p className="mt-1 text-muted-foreground">
          Optioneel: upload je openingsbalans, bankafschriften en contacten als CSV. Sla over als je dit later wilt doen.
        </p>
      </div>

      <div className="space-y-3">
        <OpeningBalanceImport
          pending
          onPendingChange={(rows) => setData((d) => ({ ...d, pendingOpeningBalance: rows ?? undefined }))}
        />
        <BankStatementImport
          pending
          onboardingBankAccounts={data.bankAccounts}
          onPendingChange={(rows) => setData((d) => ({ ...d, pendingBankRows: rows ?? undefined }))}
        />
        <ContactsImport
          pending
          onPendingChange={(rows) => setData((d) => ({ ...d, pendingContacts: rows ?? undefined }))}
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Geüploade data wordt verwerkt zodra je de wizard afrondt.
      </p>
    </div>
  );
}
