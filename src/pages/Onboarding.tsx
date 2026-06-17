import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import StepProgress from "@/components/onboarding/StepProgress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { validateKvK, validateBTW, validatePostcode, validateEmail, validateIBAN, validateBIC } from "@/lib/validators";

import StepBedrijfsprofiel from "@/components/onboarding/StepBedrijfsprofiel";
import StepBelasting from "@/components/onboarding/StepBelasting";
import StepHuisstijl from "@/components/onboarding/StepHuisstijl";
import StepBankrekeningen from "@/components/onboarding/StepBankrekeningen";
import StepImport from "@/components/onboarding/StepImport";
import StepDocumenten from "@/components/onboarding/StepDocumenten";
import StepAI from "@/components/onboarding/StepAI";
import StepTransacties from "@/components/onboarding/StepTransacties";
import StepGereedheid from "@/components/onboarding/StepGereedheid";

const STEPS = [
  { title: "Bedrijfsprofiel", skippable: false },
  { title: "Belastinginstellingen", skippable: false },
  { title: "Huisstijl & facturen", skippable: true },
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
  logoFile?: File;
  bankMethod?: "psd2" | "csv" | "manual";
  numbering: {
    prefix: string;
    format: string;
    yearlyReset: boolean;
    nextSeq: number;
  };
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
    industry: string;
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
  numbering: {
    prefix: "F",
    format: "{prefix}{year}-{seq:4}",
    yearlyReset: true,
    nextSeq: 1,
  },
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
    industry: "",
  },
  tax: {
    btwPlichtig: true,
    vatScheme: "standard",
    vatFrequency: "quarterly",
    fiscalYearStartMonth: 1,
    expectedRevenue: 0,
  },
  bankAccounts: [],
  bankMethod: "psd2",
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

  // Per-step validatie status. Geeft duidelijke reden waarom een stap blockt.
  const stepValidation = (idx: number): { ok: boolean; reason?: string } => {
    switch (idx) {
      case 0: {
        if (!data.company.name?.trim()) return { ok: false, reason: "Vul een bedrijfsnaam in." };
        const k = validateKvK(data.company.kvkNumber);
        if (!k.valid) return { ok: false, reason: k.error };
        const b = validateBTW(data.company.btwNumber);
        if (!b.valid) return { ok: false, reason: b.error };
        const p = validatePostcode(data.company.addressPostalCode);
        if (!p.valid) return { ok: false, reason: p.error };
        const e = validateEmail(data.company.email);
        if (!e.valid) return { ok: false, reason: e.error };
        return { ok: true };
      }
      case 3: {
        if (data.bankMethod === "manual") return { ok: true };
        for (const a of data.bankAccounts) {
          const ib = validateIBAN(a.iban, true);
          if (!ib.valid) return { ok: false, reason: `IBAN "${a.iban || "leeg"}": ${ib.error}` };
          const bc = validateBIC(a.bic);
          if (!bc.valid) return { ok: false, reason: bc.error };
        }
        return { ok: true };
      }
      default:
        return { ok: true };
    }
  };

  const canProceed = () => stepValidation(step).ok;

  const stepIndicators = STEPS.map((s, i) => {
    const v = stepValidation(i);
    let status: "complete" | "blocker" | "pending" | "skippable" = "pending";
    if (i < step) status = v.ok ? "complete" : "blocker";
    else if (i === step) status = v.ok ? "complete" : "blocker";
    else status = s.skippable ? "skippable" : "pending";
    return { title: s.title, status, reason: v.reason };
  });

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
        p_settings: {
          ai: data.ai,
          processing: data.documents ?? null,
          industry: data.company.industry || null,
          invoice_prefix: data.numbering.prefix,
          invoice_number_format: data.numbering.format,
          invoice_yearly_reset: data.numbering.yearlyReset,
          invoice_next_seq: data.numbering.nextSeq,
          onboarding: {
            completed_at: new Date().toISOString(),
            bank_method: data.bankMethod ?? "psd2",
            steps_completed: ["company", "tax", "branding", "bank", "import", "documents", "ai"],
          },
        },
      });

      if (setupErr) throw setupErr;

      // Upload logo (if user picked one) → branding bucket + persist URL in BOTH
      // organizations.logo_url AND organizations.settings.onboarding.logo_url
      let uploadedLogoUrl: string | null = null;
      if (data.logoFile) {
        try {
          const ext = data.logoFile.name.split(".").pop()?.toLowerCase() ?? "png";
          const path = `${orgId}/logo-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("branding")
            .upload(path, data.logoFile, { upsert: true, cacheControl: "3600" });
          if (!upErr) {
            const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
            uploadedLogoUrl = pub.publicUrl;
            // Read current settings, merge logo_url into onboarding object
            const { data: orgRow } = await supabase
              .from("organizations")
              .select("settings")
              .eq("id", orgId)
              .single();
            const mergedSettings = {
              ...((orgRow?.settings as Record<string, any>) ?? {}),
              onboarding: {
                ...(((orgRow?.settings as Record<string, any>)?.onboarding) ?? {}),
                logo_url: uploadedLogoUrl,
                logo_uploaded_at: new Date().toISOString(),
              },
            };
            await supabase
              .from("organizations")
              .update({ logo_url: uploadedLogoUrl, settings: mergedSettings })
              .eq("id", orgId);
          }
        } catch (e) {
          console.warn("logo upload failed", e);
        }
      }


      // Apply industry preset (extra accounts) if industry was chosen
      if (data.company.industry) {
        try {
          await supabase.rpc("apply_industry_preset" as any, {
            p_org_id: orgId,
            p_industry: data.company.industry,
          });
        } catch (e) {
          console.warn("industry preset failed", e);
        }
      }

      // Claim pending referral code (if user signed up via ?ref=)
      try {
        const { getPendingReferralCode, clearPendingReferralCode } = await import("@/lib/referralCapture");
        const refCode = getPendingReferralCode();
        if (refCode) {
          await supabase.rpc("claim_referral", { p_code: refCode });
          clearPendingReferralCode();
        }
      } catch {/* non-fatal */}

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

      toast.success("Organisatie aangemaakt! Welkom bij CashMaatje.");
      // Redirect op basis van gekozen bankmethode
      const dest =
        data.bankMethod === "psd2" ? "/bank/psd2-test"
        : data.bankMethod === "csv" ? "/bank/import?onboarding=1"
        : "/";
      window.location.href = dest;
    } catch (e: any) {
      toast.error(e.message || "Er ging iets mis");
    } finally {
      setSubmitting(false);
    }
  };

  const stepComponents = [
    <StepBedrijfsprofiel data={data} setData={setData} />,
    <StepBelasting data={data} setData={setData} />,
    <StepHuisstijl data={data} setData={setData} />,
    <StepBankrekeningen data={data} setData={setData} />,
    <StepImport data={data} setData={setData} />,
    <StepDocumenten data={data} setData={setData} />,
    <StepAI data={data} setData={setData} />,
    <StepTransacties data={data} />,
    <StepGereedheid data={data} />,
  ];


  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">CashMaatje instellen</h1>
          <span className="text-sm text-muted-foreground">
            Stap {step + 1} van {STEPS.length}
          </span>
        </div>
        <div className="mx-auto mt-3 max-w-2xl">
          <StepProgress
            steps={stepIndicators}
            current={step}
            onJump={(i) => i <= step && setStep(i)}
          />
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
                {submitting ? "Bezig…" : "Start met CashMaatje"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
