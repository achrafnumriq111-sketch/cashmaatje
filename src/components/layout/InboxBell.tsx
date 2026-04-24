import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBroadcasts, useSupportThreads } from "@/hooks/useMessaging";

export function InboxBell() {
  const navigate = useNavigate();
  const { unreadCount: broadcastUnread } = useBroadcasts();
  const { unreadForUser } = useSupportThreads(false);
  const total = broadcastUnread + unreadForUser;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/inbox")}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          aria-label="Inbox"
        >
          <Mail className="w-[18px] h-[18px]" />
          {total > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">Inbox</TooltipContent>
    </Tooltip>
  );
}
