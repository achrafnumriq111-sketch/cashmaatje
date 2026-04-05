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
import Placeholder from "./pages/Placeholder";
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="transacties" element={<Transactions />} />
              <Route path="facturen/verkoop" element={<SalesInvoices />} />
              <Route path="facturen/inkoop" element={<PurchaseInvoices />} />
              <Route path="reconciliatie" element={<Placeholder />} />
              <Route path="documenten" element={<Placeholder />} />
              <Route path="btw/aangifte" element={<VatReturn />} />
              <Route path="btw/icp" element={<Placeholder />} />
              <Route path="rapporten/winst-verlies" element={<Placeholder />} />
              <Route path="rapporten/balans" element={<Placeholder />} />
              <Route path="rapporten/proefbalans" element={<Placeholder />} />
              <Route path="rapporten/cashflow" element={<Placeholder />} />
              <Route path="relaties" element={<Placeholder />} />
              <Route path="grootboek" element={<Placeholder />} />
              <Route path="journaalposten" element={<Placeholder />} />
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
