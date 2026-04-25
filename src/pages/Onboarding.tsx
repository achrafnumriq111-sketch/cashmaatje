import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, SkipForward, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

import StepBedrijfsprofiel from "@/components/onboarding/StepBedrijfsprofiel";
import StepBelasting from "@/components/onboarding/StepBelasting";
import StepBankrekeningen from "@/components/onboarding/StepBankrekeningen";
import StepImport from "@/components/onboarding/StepImport";
import StepDocumenten from "@/components/onboarding/StepDocumenten";
import StepAI from "@/components/onboarding/StepAI";
import StepTransacties from "@/components/onboarding/StepTransacties";
import StepGereedheid from "@/components/onboarding/StepGereedheid";

const STEPS = [
  { title: "Bedrijfsprofiel", skippable: false },
  { title: "Belastinginstellingen", skippable: false },
  { title: "Bankrekeningen", skippable: true },
  { title: "Data importeren", skippable: true },
  { title: "Documenten", skippable: true },
  { title: "AI instellingen", skippable: true },
  { title: "Transacties controleren", skippable: true },
  { title: "Gereedheid", skippable: false },
];

export interface OnboardingData {
  pendingOpeningBalance?: { account_code: string; debit: number; credit: number; description: string }[];
  pendingBankRows?: any[];
  pendingContacts?: any[];
  documents?: {
    autoOcr: boolean;
    autoCategorize: boolean;
    duplicateCheck: boolean;
    autoAttachToTransaction: boolean;
    defaultExpenseAccount: string;
  };
  company: {
    name: string;
    legalForm: string;
    kvkNumber: string;
    btwNumber: string;
    addressStreet: string;
    addressPostalCode: string;
    addressCity: string;
    email: string;
    phone: string;
    website: string;
  };
  tax: {
    btwPlichtig: boolean;
    vatScheme: string;
    vatFrequency: string;
    fiscalYearStartMonth: number;
    expectedRevenue: number;
  };
  bankAccounts: Array<{
    name: string;
    iban: string;
    bic: string;
    bankName: string;
    isPrimary: boolean;
  }>;
  ai: {
    autoCategorize: boolean;
    autoApplyThreshold: number;
    language: string;
    showExplanations: string;
    autoAcceptThreshold: number;
  };
}

const defaultData: OnboardingData = {
  company: {
    name: "",
    legalForm: "eenmanszaak",
    kvkNumber: "",
    btwNumber: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    email: "",
    phone: "",
    website: "",
  },
  tax: {
    btwPlichtig: true,
    vatScheme: "standard",
    vatFrequency: "quarterly",
    fiscalYearStartMonth: 1,
    expectedRevenue: 0,
  },
  bankAccounts: [],
  ai: {
    autoCategorize: true,
    autoApplyThreshold: 80,
    language: "nl",
    showExplanations: "hover",
    autoAcceptThreshold: 85,
  },
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { membership, loading: organizationLoading } = useOrganization();

  useEffect(() => {
    if (!organizationLoading && membership) {
      navigate("/", { replace: true });
    }
  }, [membership, organizationLoading, navigate]);

  const progress = ((step + 1) / STEPS.length) * 100;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Validation for each step
  const canProceed = () => {
    switch (step) {
      case 0: // Bedrijfsprofiel
        return !!data.company.name?.trim();
      case 1: // Belasting
        return true;
      case 2: // Bankrekeningen
        return true; // Optional step
      case 3: // Import
        return true; // Optional step
      case 4: // Documenten
        return true;
      case 5: // AI
        return true;
      case 6: // Transacties
        return true;
      case 7: // Gereedheid
        return true;
      default:
        return true;
    }
  };
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

import StepBedrijfsprofiel from "@/components/onboarding/StepBedrijfsprofiel";
import StepBelasting from "@/components/onboarding/StepBelasting";
import StepBankrekeningen from "@/components/onboarding/StepBankrekeningen";
import StepImport from "@/components/onboarding/StepImport";
import StepDocumenten from "@/components/onboarding/StepDocumenten";
import StepAI from "@/components/onboarding/StepAI";
import StepTransacties from "@/components/onboarding/StepTransacties";
import StepGereedheid from "@/components/onboarding/StepGereedheid";

const STEPS = [
  { title: "Bedrijfsprofiel", skippable: false },
  { title: "Belastinginstellingen", skippable: false },
  { title: "Bankrekeningen", skippable: true },
  { title: "Data importeren", skippable: true },
  { title: "Documenten", skippable: true },
  { title: "AI instellingen", skippable: true },
  { title: "Transacties controleren", skippable: true },
  { title: "Gereedheid", skippable: false },
];

export interface OnboardingData {
  pendingOpeningBalance?: { account_code: string; debit: number; credit: number; description: string }[];
  pendingBankRows?: any[];
  pendingContacts?: any[];
  documents?: {
    autoOcr: boolean;
    autoCategorize: boolean;
    duplicateCheck: boolean;
    autoAttachToTransaction: boolean;
    defaultExpenseAccount: string;
  };
  company: {
    name: string;
    legalForm: string;
    kvkNumber: string;
    btwNumber: string;
    addressStreet: string;
    addressPostalCode: string;
    addressCity: string;
    email: string;
    phone: string;
    website: string;
  };
  tax: {
    btwPlichtig: boolean;
    vatScheme: string;
    vatFrequency: string;
    fiscalYearStartMonth: number;
    expectedRevenue: number;
  };
  bankAccounts: Array<{
    name: string;
    iban: string;
    bic: string;
    bankName: string;
    isPrimary: boolean;
  }>;
  ai: {
    autoCategorize: boolean;
    autoApplyThreshold: number;
    language: string;
    showExplanations: string;
    autoAcceptThreshold: number;
  };
}

const defaultData: OnboardingData = {
  company: {
    name: "",
    legalForm: "eenmanszaak",
    kvkNumber: "",
    btwNumber: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    email: "",
    phone: "",
    website: "",
  },
  tax: {
    btwPlichtig: true,
    vatScheme: "standard",
    vatFrequency: "quarterly",
    fiscalYearStartMonth: 1,
    expectedRevenue: 0,
  },
  bankAccounts: [],
  ai: {
    autoCategorize: true,
    autoApplyThreshold: 80,
    language: "nl",
    showExplanations: "hover",
    autoAcceptThreshold: 85,
  },
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { membership, loading: organizationLoading } = useOrganization();

  useEffect(() => {
    if (!organizationLoading && membership) {
      navigate("/", { replace: true });
    }
  }, [membership, organizationLoading, navigate]);

  const progress = ((step + 1) / STEPS.length) * 100;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Validation for each step
  const canProceed = () => {
    switch (step) {
      case 0: // Bedrijfsprofiel
        return !!data.company.name?.trim();
      case 1: // Belasting
        return true;
      case 2: // Bankrekeningen
        return true; // Optional step
      case 3: // Import
        return true; // Optional step
      case 4: // Documenten
        return true;
      case 5: // AI
        return true;
      case 6: // Transacties
        return true;
      case 7: // Gereedheid
        return true;
      default:
        return true;
    }
  };

  const finish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const orgTypeMap: Record<string, string> = {
        eenmanszaak: "eenmanszaak",
        vof: "vof",
        bv: "bv",
        nv: "bv",
        stichting: "stichting",
        maatschap: "vof",
        cv: "vof",
      };

      // Validate required fields
      if (!data.company.name?.trim()) {
        throw new Error("Bedrijfsnaam is verplicht");
      }

      // Single RPC call that creates org + member + seeds everything
      const { data: orgId, error: setupErr } = await supabase.rpc("setup_new_organization", {
        p_user_id: user.id,
        p_name: data.company.name,
        p_legal_name: data.company.name,
        p_org_type: (orgTypeMap[data.company.legalForm] || "eenmanszaak") as any,
        p_kvk_number: data.company.kvkNumber || null,
        p_btw_number: data.company.btwNumber || null,
        p_address_street: data.company.addressStreet || null,
        p_address_postal_code: data.company.addressPostalCode || null,
        p_address_city: data.company.addressCity || null,
        p_email: data.company.email || null,
        p_phone: data.company.phone || null,
        p_website: data.company.website || null,
        p_vat_scheme: data.tax.vatScheme as any,
        p_vat_frequency: data.tax.vatFrequency as any,
        p_fiscal_year_start_month: data.tax.fiscalYearStartMonth,
        p_kor_eligible: data.tax.vatScheme === "kor",
        p_settings: { ai: data.ai, processing: data.documents ?? null },
      });

      if (setupErr) throw setupErr;

      // Create bank accounts and remember the primary id (for queued bank rows)
      let primaryBankId: string | null = null;
      for (const ba of data.bankAccounts) {
        const { data: inserted } = await supabase.from("bank_accounts").insert({
          organization_id: orgId,
          name: ba.name,
          iban: ba.iban,
          bic: ba.bic || null,
          bank_name: ba.bankName || null,
          is_primary: ba.isPrimary,
        }).select("id, is_primary").single();
        if (inserted?.is_primary) primaryBankId = inserted.id;
      }
      if (!primaryBankId && data.bankAccounts[0]) {
        const { data: first } = await supabase.from("bank_accounts").select("id").eq("organization_id", orgId).limit(1).maybeSingle();
        primaryBankId = first?.id ?? null;
      }

      // Queued imports from StepImport
      if (data.pendingOpeningBalance && data.pendingOpeningBalance.length > 0) {
        await supabase.rpc("import_opening_balance", {
          p_org_id: orgId,
          p_date: new Date().toISOString().slice(0, 10),
          p_lines: data.pendingOpeningBalance as never,
        });
      }
      if (data.pendingContacts && data.pendingContacts.length > 0) {
        await supabase.from("contacts").insert(
          data.pendingContacts.map((c: any) => ({ ...c, organization_id: orgId }))
        );
      }
      if (data.pendingBankRows && data.pendingBankRows.length > 0 && primaryBankId) {
        await supabase.from("bank_transactions").insert(
          data.pendingBankRows.map((r: any) => ({ ...r, organization_id: orgId, bank_account_id: primaryBankId }))
        );
      }

      toast.success("Organisatie aangemaakt! Welkom bij Cash Maatje.");
      // Force full reload to ensure fresh organization state
      window.location.href = "/";
    } catch (e: any) {
      toast.error(e.message || "Er ging iets mis");
    } finally {
      setSubmitting(false);
    }
  };

  const stepComponents = [
    <StepBedrijfsprofiel data={data} setData={setData} />,
    <StepBelasting data={data} setData={setData} />,
    <StepBankrekeningen data={data} setData={setData} />,
    <StepImport data={data} setData={setData} />,
    <StepDocumenten data={data} setData={setData} />,
    <StepAI data={data} setData={setData} />,
    <StepTransacties data={data} />,
    <StepGereedheid data={data} />,
  ];

  // Validation for each step
  const canProceed = () => {
    switch (step) {
      case 0: // Bedrijfsprofiel
        return !!data.company.name?.trim();
      case 1: // Belasting
        return true;
      case 2: // Bankrekeningen
        return true; // Optional step
      case 3: // Import
        return true; // Optional step
      case 4: // Documenten
        return true;
      case 5: // AI
        return true;
      case 6: // Transacties
        return true;
      case 7: // Gereedheid
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Cash Maatje instellen</h1>
          <span className="text-sm text-muted-foreground">
            Stap {step + 1} van {STEPS.length}
          </span>
        </div>
        <div className="mx-auto mt-3 max-w-2xl">
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Step title */}
      <div className="mx-auto w-full max-w-2xl px-6 pt-8">
        <p className="text-sm font-medium text-primary">{STEPS[step].title}</p>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {stepComponents[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vorige
          </Button>

          <div className="flex gap-2">
            {STEPS[step].skippable && step < STEPS.length - 1 && (
              <Button variant="ghost" onClick={next} className="text-muted-foreground">
                Overslaan
                <SkipForward className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!canProceed()}>
                Volgende
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={submitting || !canProceed()}>
                {submitting ? "Bezig…" : "Start met Cash Maatje"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
