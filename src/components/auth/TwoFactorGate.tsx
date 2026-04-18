import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { use2FASettings, useAAL, gracePeriodActive, daysLeftInGrace } from "@/hooks/use2FA";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const PUBLIC_2FA_ROUTES = ["/2fa/setup", "/2fa/verify", "/2fa/recovery"];

export function TwoFactorGate({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: settings, isLoading: settingsLoading } = use2FASettings(user?.id);
  const aal = useAAL();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || settingsLoading || aal.loading) return;
    if (!user) return;
    if (PUBLIC_2FA_ROUTES.some((r) => location.pathname.startsWith(r))) return;

    // 2FA is enrolled — must reach AAL2
    if (settings?.is_enabled || aal.nextLevel === "aal2") {
      if (aal.currentLevel !== "aal2") {
        navigate("/2fa/verify", { replace: true });
      }
      return;
    }

    // Not enrolled — check grace period
    if (settings?.is_required) {
      if (gracePeriodActive(settings)) {
        const days = daysLeftInGrace(settings);
        if (days <= 3) {
          toast.warning(`Stel binnen ${days} dag${days === 1 ? "" : "en"} tweestapsverificatie in`, { id: "2fa-grace" });
        }
      } else {
        navigate("/2fa/setup", { replace: true });
      }
    }
  }, [user, settings, aal, authLoading, settingsLoading, navigate, location.pathname]);

  if (authLoading || (user && (settingsLoading || aal.loading))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
