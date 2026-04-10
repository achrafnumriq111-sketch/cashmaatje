import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import SalesInvoices from "./pages/SalesInvoices";
import PurchaseInvoices from "./pages/PurchaseInvoices";
import VatReturn from "./pages/VatReturn";
import ProfitLoss from "./pages/ProfitLoss";
import BalanceSheet from "./pages/BalanceSheet";
import TrialBalance from "./pages/TrialBalance";
import Cashflow from "./pages/Cashflow";
import Placeholder from "./pages/Placeholder";
import JournalEntries from "./pages/JournalEntries";
import GeneralLedger from "./pages/GeneralLedger";
import Contacts from "./pages/Contacts";
import Documents from "./pages/Documents";
import Reconciliation from "./pages/Reconciliation";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="transacties" element={<Transactions />} />
              <Route path="facturen/verkoop" element={<SalesInvoices />} />
              <Route path="facturen/inkoop" element={<PurchaseInvoices />} />
              <Route path="reconciliatie" element={<Reconciliation />} />
              <Route path="documenten" element={<Documents />} />
              <Route path="btw/aangifte" element={<VatReturn />} />
              <Route path="btw/icp" element={<Placeholder />} />
              <Route path="rapporten/winst-verlies" element={<ProfitLoss />} />
              <Route path="rapporten/balans" element={<BalanceSheet />} />
              <Route path="rapporten/proefbalans" element={<TrialBalance />} />
              <Route path="rapporten/cashflow" element={<Cashflow />} />
              <Route path="relaties" element={<Contacts />} />
              <Route path="grootboek" element={<GeneralLedger />} />
              <Route path="journaalposten" element={<JournalEntries />} />
              <Route path="instellingen" element={<Placeholder />} />
              <Route path="audit-log" element={<Placeholder />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
