import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthLogo } from "@/components/AuthLogo";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(`${FN_URL}?token=${encodeURIComponent(token)}`, {
          headers: { apikey: ANON },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.valid) setState("valid");
        else if (data?.already_unsubscribed) setState("already");
        else { setState("invalid"); setMessage(data?.error ?? ""); }
      } catch (e: any) { setState("invalid"); setMessage(e?.message ?? ""); }
    })();
  }, [token]);

  async function confirm() {
    setState("submitting");
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setState("error"); setMessage(d?.error ?? "Er ging iets mis"); return;
      }
      setState("done");
    } catch (e: any) { setState("error"); setMessage(e?.message ?? ""); }
  }

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex justify-center"><AuthLogo /></div>
        {state === "loading" && <p className="text-sm text-muted-foreground">Even controleren...</p>}
        {state === "valid" && (
          <>
            <h1 className="text-xl font-semibold text-foreground">Uitschrijven bevestigen</h1>
            <p className="text-sm text-muted-foreground">Klik om geen e-mails meer van CashMaatje te ontvangen.</p>
            <Button onClick={confirm} className="w-full">Uitschrijven bevestigen</Button>
          </>
        )}
        {state === "submitting" && <p className="text-sm text-muted-foreground">Bezig...</p>}
        {state === "already" && <p className="text-sm text-muted-foreground">Je bent al uitgeschreven.</p>}
        {state === "done" && <p className="text-sm text-foreground">Je bent uitgeschreven. Bedankt.</p>}
        {state === "invalid" && <p className="text-sm text-red-400">Deze link is ongeldig of verlopen. {message}</p>}
        {state === "error" && <p className="text-sm text-red-400">Er ging iets mis. {message}</p>}
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Terug naar CashMaatje</Link>
      </div>
    </div>
  );
}
