import { useState } from "react";
import { Bell, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { NotificationPanel } from "./NotificationPanel";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const roleLabels: Record<UserRole, string> = {
  entrepreneur: "Ondernemer",
  bookkeeper: "Boekhouder",
  accountant: "Accountant",
  admin: "Admin",
};

interface TopHeaderProps {
  organizationName: string;
  role: UserRole;
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function TopHeader({
  organizationName,
  role,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: TopHeaderProps) {
  const { user, signOut } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="
          sticky top-0 z-30 h-14 px-6
          flex items-center justify-between
          bg-background/80 backdrop-blur-xl
          border-b border-border
        "
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
          </div>
          <span className="text-[13px] text-muted-foreground font-medium">{organizationName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotifOpen(true)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-all duration-200"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </motion.button>

          {/* User avatar */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setProfileOpen(!profileOpen)}
              className="
                w-9 h-9 rounded-xl
                bg-muted hover:bg-muted/80
                flex items-center justify-center
                text-[12px] font-semibold text-muted-foreground
                transition-all duration-200
                border border-border
              "
            >
              {initials}
            </motion.button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-48 rounded-xl bg-card border border-border shadow-lg overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
                    <p className="text-[10px] text-muted-foreground">{roleLabels[role]}</p>
                  </div>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-foreground/80 hover:bg-muted/50 transition-colors">
                    <User className="w-3.5 h-3.5" /> Profiel
                  </button>
                  <div className="border-t border-border" />
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-destructive hover:bg-muted/50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Uitloggen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.header>

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkRead={onMarkRead}
        onMarkAllRead={onMarkAllRead}
      />
    </>
  );
}
