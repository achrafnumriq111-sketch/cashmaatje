import { X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const severityColor: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  error: "bg-destructive/20 text-destructive",
  success: "bg-primary/20 text-primary",
};

export function NotificationPanel({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[380px] border-l border-border bg-card p-0 sm:w-[420px]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <SheetTitle className="text-base font-semibold">Meldingen</SheetTitle>
          <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs text-muted-foreground">
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            Alles gelezen
          </Button>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-60px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Check className="mb-2 h-8 w-8" />
              <p className="text-sm">Geen meldingen</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && onMarkRead(n.id)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    !n.is_read ? "bg-muted/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {!n.is_read && <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        <span className="text-sm font-medium text-foreground">{n.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message_nl ?? n.message}</p>
                    </div>
                    <Badge variant="secondary" className={`shrink-0 text-[10px] ${severityColor[n.severity] ?? ""}`}>
                      {n.severity}
                    </Badge>
                  </div>
                  {n.created_at && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nl })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
