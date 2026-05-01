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
      <header className="sticky top-0 z-30 h-16 px-6 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border/60">
        {/* LEFT: Search */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span className="text-[13px]">{t("common.search")}</span>
            <span className="flex items-center gap-0.5 ml-6">
              <kbd className="px-1.5 py-0.5 rounded-md bg-card border border-border text-[10px] font-medium">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded-md bg-card border border-border text-[10px] font-medium">K</kbd>
            </span>
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1">
          <OrgSwitcher />

          <div className="w-px h-5 bg-border/70 mx-2" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/platform/referral")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setNotifOpen(true)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Bell className="w-[17px] h-[17px]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t("header.notifications")}</TooltipContent>
          </Tooltip>

          {/* User avatar */}
          <div className="relative ml-1">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-[12px] font-semibold text-foreground transition-colors"
            >
              {initials}
            </button>

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
      </header>

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
