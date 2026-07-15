import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { AppLayout } from "@/components/layout/AppLayout";
import { TwoFactorGate } from "@/components/auth/TwoFactorGate";

import BulkSettings from "./pages/BulkSettings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import TwoFactorRecovery from "./pages/TwoFactorRecovery";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import SalesInvoices from "./pages/SalesInvoices";
import PurchaseInvoices from "./pages/PurchaseInvoices";
import VatReturn from "./pages/VatReturn";
import ProfitLoss from "./pages/ProfitLoss";
import BalanceSheet from "./pages/BalanceSheet";
import TrialBalance from "./pages/TrialBalance";
import Cashflow from "./pages/Cashflow";
import Settings from "./pages/Settings";
import AuditLog from "./pages/AuditLog";
import JournalEntries from "./pages/JournalEntries";
import GeneralLedger from "./pages/GeneralLedger";
import Contacts from "./pages/Contacts";
import Documents from "./pages/Documents";
import Receipts from "./pages/Receipts";
import Reconciliation from "./pages/Reconciliation";
import Onboarding from "./pages/Onboarding";
import TaxDeductions from "./pages/TaxDeductions";
import SalaryOverview from "./pages/SalaryOverview";
import BusinessExpenses from "./pages/BusinessExpenses";
import Depreciations from "./pages/Depreciations";
import DeductiblePremiums from "./pages/DeductiblePremiums";
import CompanyCarPage from "./pages/CompanyCarPage";
import MortgagePage from "./pages/MortgagePage";
import IcpReport from "./pages/IcpReport";
import NotFound from "./pages/NotFound";
// New modules
import AnnualReport from "./pages/AnnualReport";
import AuditDossier from "./pages/AuditDossier";
import ContractIntelligence from "./pages/ContractIntelligence";
import ComplianceCheck from "./pages/ComplianceCheck";
import ProcessFlows from "./pages/ProcessFlows";
import OfferteStudio from "./pages/OfferteStudio";
import AutomationCenter from "./pages/AutomationCenter";
import StakeholderCRM from "./pages/StakeholderCRM";
import ThemeStudio from "./pages/ThemeStudio";
import ReferralCenter from "./pages/ReferralCenter";
import CorporateStructure from "./pages/CorporateStructure";
import FinancialIntelligence from "./pages/FinancialIntelligence";
import Inventory from "./pages/Inventory";
import Integrations from "./pages/Integrations";
import PaymentReminders from "./pages/PaymentReminders";
import CorporateTax from "./pages/CorporateTax";
import Salary from "./pages/Salary";

import CheckoutReturn from "./pages/CheckoutReturn";
import Inbox from "./pages/Inbox";
import Admin from "./pages/Admin";
import FixTheChaos from "./pages/FixTheChaos";
import Landing from "./pages/Landing";
import Unsubscribe from "./pages/Unsubscribe";
import TaxReserve from "./pages/TaxReserve";
import RecurringInvoices from "./pages/RecurringInvoices";
import QuarterlyChecklist from "./pages/QuarterlyChecklist";
import ExportCenter from "./pages/ExportCenter";
import BankImport from "./pages/BankImport";
import Psd2TestImport from "./pages/Psd2TestImport";
import ScenarioSimulator from "./pages/ScenarioSimulator";
import FinancialHealth from "./pages/FinancialHealth";
import AccountantPortal from "./pages/AccountantPortal";
import Pricing from "./pages/Pricing";
import MileageLog from "./pages/MileageLog";
import Benefits from "./pages/Benefits";
import TimeRegistration from "./pages/TimeRegistration";
import Agenda from "./pages/Agenda";
import UsersAndRoles from "./pages/UsersAndRoles";
import Security from "./pages/Security";
import PublicCompliance from "./pages/PublicCompliance";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { CookieConsent } from "./components/legal/CookieConsent";



const queryClient = new QueryClient();

function RootIndex() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  // Not logged in → show public landing page at "/"
  if (!session) return <Landing />;
  // Logged in → show the app's home (corporate structure dashboard)
  return <CorporateStructure />;
}

function AuthedLayout() {
  return (
    <ProtectedRoute>
      <TwoFactorGate>
        <AppLayout />
      </TwoFactorGate>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CookieConsent />
        <AuthProvider>
          <OrganizationProvider>
          <Routes>
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/security" element={<Security />} />
            <Route path="/compliance" element={<PublicCompliance />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/2fa/setup" element={<ProtectedRoute><TwoFactorSetup /></ProtectedRoute>} />
            <Route path="/2fa/verify" element={<ProtectedRoute><TwoFactorVerify /></ProtectedRoute>} />
            <Route path="/2fa/recovery" element={<TwoFactorRecovery />} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/" element={<RootIndex />} />
            <Route element={<AuthedLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="fix-the-chaos" element={<FixTheChaos />} />
              <Route path="transacties" element={<Transactions />} />
              <Route path="facturen/verkoop" element={<SalesInvoices />} />
              <Route path="facturen/inkoop" element={<PurchaseInvoices />} />
              <Route path="facturen/herinneringen" element={<PaymentReminders />} />
              <Route path="reconciliatie" element={<Reconciliation />} />
              <Route path="bonnen" element={<Receipts />} />
              <Route path="documenten" element={<Documents />} />
              <Route path="btw/aangifte" element={<VatReturn />} />
              <Route path="btw/icp" element={<IcpReport />} />
              <Route path="belasting/reserve" element={<TaxReserve />} />
              <Route path="belasting/checklist" element={<QuarterlyChecklist />} />
              <Route path="facturen/terugkerend" element={<RecurringInvoices />} />
              <Route path="exports" element={<ExportCenter />} />
              <Route path="bank/import" element={<BankImport />} />
              <Route path="bank/psd2-test" element={<Psd2TestImport />} />
              <Route path="insights/scenario" element={<ScenarioSimulator />} />
              <Route path="insights/health" element={<FinancialHealth />} />
              <Route path="accountant" element={<AccountantPortal />} />
              <Route path="rapporten/winst-verlies" element={<ProfitLoss />} />
              <Route path="rapporten/balans" element={<BalanceSheet />} />
              <Route path="rapporten/proefbalans" element={<TrialBalance />} />
              <Route path="rapporten/cashflow" element={<Cashflow />} />
              <Route path="rapporten/jaarrekening" element={<AnnualReport />} />
              <Route path="rapporten/intelligence" element={<FinancialIntelligence />} />
              <Route path="belasting/ondernemersaftrek" element={<TaxDeductions />} />
              <Route path="salaris" element={<SalaryOverview />} />
              <Route path="salaris/bedrijfskosten" element={<BusinessExpenses />} />
              <Route path="salaris/afschrijvingen" element={<Depreciations />} />
              <Route path="salaris/premies" element={<DeductiblePremiums />} />
              <Route path="salaris/auto" element={<CompanyCarPage />} />
              <Route path="salaris/woning" element={<MortgagePage />} />
              <Route path="salaris/medewerkers" element={<Salary />} />
              <Route path="salaris/kilometers" element={<MileageLog />} />
              <Route path="salaris/toeslagen" element={<Benefits />} />
              <Route path="belasting/vpb" element={<CorporateTax />} />
              <Route path="relaties" element={<Contacts />} />
              <Route path="grootboek" element={<GeneralLedger />} />
              <Route path="journaalposten" element={<JournalEntries />} />
              <Route path="voorraad" element={<Inventory />} />
              <Route path="integraties" element={<Integrations />} />
              {/* New enterprise modules */}
              <Route path="offerte-studio" element={<OfferteStudio />} />
              <Route path="audit/dossier" element={<AuditDossier />} />
              <Route path="audit/contracten" element={<ContractIntelligence />} />
              <Route path="audit/compliance" element={<ComplianceCheck />} />
              <Route path="audit/processen" element={<ProcessFlows />} />
              <Route path="platform/stakeholders" element={<StakeholderCRM />} />
              <Route path="platform/automation" element={<AutomationCenter />} />
              <Route path="platform/structuur" element={<CorporateStructure />} />
              <Route path="platform/referral" element={<ReferralCenter />} />
              <Route path="platform/themas" element={<ThemeStudio />} />
              <Route path="instellingen" element={<Settings />} />
              <Route path="instellingen/bulk" element={<BulkSettings />} />
              <Route path="audit-log" element={<AuditLog />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="uren" element={<TimeRegistration />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="instellingen/gebruikers" element={<UsersAndRoles />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
