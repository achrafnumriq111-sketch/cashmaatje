import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { useOrganization } from "@/hooks/useOrganization";
import { useNotifications } from "@/hooks/useNotifications";
import { Loader2 } from "lucide-react";

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
    <SidebarProvider>
      <div className="dark flex min-h-screen w-full">
        <AppSidebar role={role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopHeader
            organizationName={membership.organizationName}
            role={role}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllRead}
          />
          <main className="flex-1 overflow-auto bg-background p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
