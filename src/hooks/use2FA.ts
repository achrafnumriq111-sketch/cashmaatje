import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface TwoFASettings {
  id: string;
  user_id: string;
  is_required: boolean;
  is_enabled: boolean;
  grace_period_start: string;
  enabled_at: string | null;
  exempted_until: string | null;
}

const GRACE_PERIOD_DAYS = 7;

export function gracePeriodEndsAt(start: string): Date {
  const d = new Date(start);
  d.setDate(d.getDate() + GRACE_PERIOD_DAYS);
  return d;
}

export function gracePeriodActive(settings: TwoFASettings | null | undefined): boolean {
  if (!settings) return false;
  if (settings.exempted_until && new Date(settings.exempted_until) > new Date()) return true;
  return gracePeriodEndsAt(settings.grace_period_start) > new Date();
}

export function daysLeftInGrace(settings: TwoFASettings | null | undefined): number {
  if (!settings) return 0;
  const ms = gracePeriodEndsAt(settings.grace_period_start).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function use2FASettings(userId: string | undefined) {
  return useQuery({
    queryKey: ["2fa-settings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_2fa_settings")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as TwoFASettings | null;
    },
  });
}

export function useAAL() {
  const [aal, setAal] = useState<{ currentLevel: string | null; nextLevel: string | null; loading: boolean }>({
    currentLevel: null,
    nextLevel: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (error) {
        setAal({ currentLevel: null, nextLevel: null, loading: false });
        return;
      }
      setAal({ currentLevel: data.currentLevel, nextLevel: data.nextLevel, loading: false });
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return aal;
}
