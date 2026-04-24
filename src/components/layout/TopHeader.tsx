import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, User, Search, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { NotificationPanel } from "./NotificationPanel";
import { LanguageToggle } from "./LanguageToggle";
import { OrgSwitcher } from "./OrgSwitcher";
import { InboxBell } from "./InboxBell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const roleLabels: Record<UserRole, { nl: string; en: string }> = {
  entrepreneur: { nl: "Ondernemer", en: "Entrepreneur" },
  bookkeeper: { nl: "Boekhouder", en: "Bookkeeper" },
  accountant: { nl: "Accountant", en: "Accountant" },
  admin: { nl: "Admin", en: "Admin" },
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
  role,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: TopHeaderProps) {
  const { user, signOut } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "??";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-30 h-14 px-6 flex items-center justify-between bg-card/80 backdrop-blur-xl border-b border-border"
      >
        {/* LEFT: Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-muted-foreground">
            <Search className="w-3.5 h-3.5" />
            <span className="text-[12px]">{t("common.search")}</span>
            <div className="flex items-center gap-0.5 ml-4">
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-medium">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-medium">K</kbd>
            </div>
          </div>
        </div>

        {/* RIGHT: Company switcher | Referrals | Lang | Notif | Avatar */}
        <div className="flex items-center gap-1.5">
          <OrgSwitcher />

          <div className="w-px h-5 bg-border mx-1" />

          {/* Referrals quick action */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/platform/referral")}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-all duration-200"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>{t("header.referrals")}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {t("tip.referrals")}
            </TooltipContent>
          </Tooltip>

          <LanguageToggle compact />

          <InboxBell />

          {/* Notification bell */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotifOpen(true)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t("header.notifications")}</TooltipContent>
          </Tooltip>

          {/* User avatar */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-[12px] font-semibold text-muted-foreground transition-all duration-200 border border-border"
            >
              {initials}
            </motion.button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-52 rounded-xl bg-card border border-border shadow-lg overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
                    <p className="text-[10px] text-muted-foreground">{roleLabels[role][lang]}</p>
                  </div>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-foreground hover:bg-secondary transition-colors">
                    <User className="w-3.5 h-3.5" /> {t("header.profile")}
                  </button>
                  <div className="border-t border-border" />
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-destructive hover:bg-secondary transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> {t("header.signOut")}
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
