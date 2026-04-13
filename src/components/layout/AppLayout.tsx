import { Outlet, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { useOrganization } from "@/hooks/useOrganization";
import { useNotifications } from "@/hooks/useNotifications";
import { Loader2 } from "lucide-react";
import { pageTransition } from "@/lib/animations";

export function AppLayout() {
  const { membership, loading } = useOrganization();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(
    membership?.organizationId
  );

  if (loading) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!membership) {
    return <Navigate to="/onboarding" replace />;
  }

  const role = membership.role;

  return (
    <div className="dark min-h-screen bg-background">
      <AppSidebar role={role} />
      <div className="pl-[260px] min-h-screen flex flex-col">
        <TopHeader
          organizationName={membership.organizationName}
          role={role}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={markAsRead}
          onMarkAllRead={markAllRead}
        />
        <motion.main
          variants={pageTransition}
          initial="initial"
          animate="animate"
          className="flex-1 overflow-auto px-6 py-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
