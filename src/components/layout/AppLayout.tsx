import { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { ChatbotFab } from "./ChatbotFab";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { BroadcastBanner } from "./BroadcastBanner";
import { MobileNavProvider } from "./MobileNavContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useNotifications } from "@/hooks/useNotifications";
import { Loader2 } from "lucide-react";
import { pageTransition } from "@/lib/animations";
import { supabase } from "@/integrations/supabase/client";
import { applyBrandColors } from "@/components/settings/BrandingPanel";

export function AppLayout() {
  const { membership, loading } = useOrganization();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(
    membership?.organizationId
  );

  // Apply organization brand colors on load
  useEffect(() => {
    if (!membership?.organizationId) return;
    (async () => {
      const { data } = await supabase
        .from("organizations").select("settings").eq("id", membership.organizationId).single();
      const s = (data?.settings as any) ?? {};
      applyBrandColors({ primary: s.brand_primary, secondary: s.brand_secondary });
    })();
  }, [membership?.organizationId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!membership) {
    return <Navigate to="/onboarding" replace />;
  }

  const role = membership.role;

  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar role={role} />
        <div className="md:pl-[260px] min-h-screen flex flex-col">
          <TopHeader
            organizationName={membership.organizationName}
            role={role}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllRead}
          />
          <BroadcastBanner />
          <motion.main
            variants={pageTransition}
            initial="initial"
            animate="animate"
            className="flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6"
          >
            <Outlet />
          </motion.main>
        </div>
        <ChatbotFab />
        <FeedbackButton />
      </div>
    </MobileNavProvider>
  );
}
