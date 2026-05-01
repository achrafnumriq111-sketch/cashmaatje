import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import TaxReserve from "./pages/TaxReserve";
import RecurringInvoices from "./pages/RecurringInvoices";
import QuarterlyChecklist from "./pages/QuarterlyChecklist";
import { ModuleLockOverlay } from "./components/modules/ModuleLockOverlay";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/2fa/setup" element={<ProtectedRoute><TwoFactorSetup /></ProtectedRoute>} />
            <Route path="/2fa/verify" element={<ProtectedRoute><TwoFactorVerify /></ProtectedRoute>} />
            <Route path="/2fa/recovery" element={<TwoFactorRecovery />} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><TwoFactorGate><AppLayout /></TwoFactorGate></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
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
              <Route path="rapporten/winst-verlies" element={<ProfitLoss />} />
              <Route path="rapporten/balans" element={<BalanceSheet />} />
              <Route path="rapporten/proefbalans" element={<TrialBalance />} />
              <Route path="rapporten/cashflow" element={<Cashflow />} />
              <Route path="rapporten/jaarrekening" element={<ModuleLockOverlay moduleKey="annual_report"><AnnualReport /></ModuleLockOverlay>} />
              <Route path="rapporten/intelligence" element={<ModuleLockOverlay moduleKey="financial_intelligence"><FinancialIntelligence /></ModuleLockOverlay>} />
              <Route path="belasting/ondernemersaftrek" element={<TaxDeductions />} />
              <Route path="salaris" element={<SalaryOverview />} />
              <Route path="salaris/bedrijfskosten" element={<BusinessExpenses />} />
              <Route path="salaris/afschrijvingen" element={<Depreciations />} />
              <Route path="salaris/premies" element={<DeductiblePremiums />} />
              <Route path="salaris/auto" element={<CompanyCarPage />} />
              <Route path="salaris/woning" element={<MortgagePage />} />
              <Route path="salaris/medewerkers" element={<Salary />} />
              <Route path="belasting/vpb" element={<CorporateTax />} />
              <Route path="relaties" element={<Contacts />} />
              <Route path="grootboek" element={<GeneralLedger />} />
              <Route path="journaalposten" element={<JournalEntries />} />
              <Route path="voorraad" element={<Inventory />} />
              <Route path="integraties" element={<Integrations />} />
              {/* New enterprise modules */}
              <Route path="offerte-studio" element={<OfferteStudio />} />
              <Route path="audit/dossier" element={<ModuleLockOverlay moduleKey="audit_dossier"><AuditDossier /></ModuleLockOverlay>} />
              <Route path="audit/contracten" element={<ModuleLockOverlay moduleKey="contract_intelligence"><ContractIntelligence /></ModuleLockOverlay>} />
              <Route path="audit/compliance" element={<ModuleLockOverlay moduleKey="compliance_check"><ComplianceCheck /></ModuleLockOverlay>} />
              <Route path="audit/processen" element={<ModuleLockOverlay moduleKey="process_flows"><ProcessFlows /></ModuleLockOverlay>} />
              <Route path="platform/stakeholders" element={<ModuleLockOverlay moduleKey="stakeholder_crm"><StakeholderCRM /></ModuleLockOverlay>} />
              <Route path="platform/automation" element={<ModuleLockOverlay moduleKey="automation_center"><AutomationCenter /></ModuleLockOverlay>} />
              <Route path="platform/structuur" element={<ModuleLockOverlay moduleKey="corporate_structure"><CorporateStructure /></ModuleLockOverlay>} />
              <Route path="platform/referral" element={<ReferralCenter />} />
              <Route path="platform/themas" element={<ModuleLockOverlay moduleKey="theme_studio"><ThemeStudio /></ModuleLockOverlay>} />
              <Route path="instellingen" element={<Settings />} />
              <Route path="instellingen/bulk" element={<BulkSettings />} />
              <Route path="audit-log" element={<AuditLog />} />
              <Route path="inbox" element={<Inbox />} />
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
