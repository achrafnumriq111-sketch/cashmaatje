import { useEffect, useRef } from "react";
import { toast } from "sonner";

const IDLE_MS = 10 * 60 * 1000; // 10 minutes
const THROTTLE_MS = 5000;
const STORAGE_KEY = "arcory:lastActivity";

export function useIdleLogout(active: boolean, onLogout: () => void) {
  const timerRef = useRef<number | null>(null);
  const lastPingRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const fire = () => {
      try {
        toast.error("Je bent automatisch uitgelogd na 10 minuten inactiviteit.");
      } catch {}
      onLogout();
    };

    const schedule = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(fire, IDLE_MS);
    };

    const ping = () => {
      const now = Date.now();
      if (now - lastPingRef.current < THROTTLE_MS) return;
      lastPingRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {}
      schedule();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) schedule();
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;
    events.forEach((ev) => window.addEventListener(ev, ping, { passive: true }));
    document.addEventListener("visibilitychange", ping);
    window.addEventListener("storage", onStorage);

    schedule();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, ping));
      document.removeEventListener("visibilitychange", ping);
      window.removeEventListener("storage", onStorage);
    };
  }, [active, onLogout]);
}
