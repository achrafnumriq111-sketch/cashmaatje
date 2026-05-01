import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface MobileNavCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<MobileNavCtx | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // lock body scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return <Ctx.Provider value={{ open, setOpen, toggle }}>{children}</Ctx.Provider>;
}

export function useMobileNav() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMobileNav outside provider");
  return v;
}
