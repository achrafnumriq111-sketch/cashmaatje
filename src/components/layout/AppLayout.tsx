import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { useOrganization } from "@/hooks/useOrganization";
import { useNotifications } from "@/hooks/useNotifications";

export function AppLayout() {
  const { membership } = useOrganization();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(
    membership?.organizationId
  );

  const role = membership?.role ?? "entrepreneur";

  return (
    <SidebarProvider>
      <div className="dark flex min-h-screen w-full">
        <AppSidebar role={role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopHeader
            organizationName={membership?.organizationName ?? "Arcory"}
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
