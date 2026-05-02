import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthLogo } from "@/components/AuthLogo";
import { toast } from "sonner";
import { Mail, CheckCircle2 } from "lucide-react";

const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Decide whether an invoke error is worth retrying (transient network / 5xx). */
function isTransient(err: any): boolean {
  if (!err) return false;
  const status = err?.context?.status ?? err?.status;
  if (typeof status === "number") return status >= 500 || status === 408 || status === 429;
  const msg = String(err?.message ?? err).toLowerCase();
  return /network|failed to fetch|timeout|fetch error|load failed/.test(msg);
}

/** Map server / transport errors to a friendly Dutch message. */
function friendlyMessage(err: any): string {
  const status = err?.context?.status ?? err?.status;
  if (status === 400) return "Vul een geldig e-mailadres in.";
  if (status === 429) return "Te veel pogingen. Probeer het over een paar minuten opnieuw.";
  if (typeof status === "number" && status >= 500) {
    return "Onze server reageert even niet. Probeer het zo opnieuw.";
  }
  const msg = String(err?.message ?? "").toLowerCase();
  if (/network|failed to fetch|load failed/.test(msg)) {
    return "Geen verbinding. Controleer je internet en probeer opnieuw.";
  }
  return "Er ging iets mis. Probeer het opnieuw.";
}

export default function TwoFactorRecovery() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setResetting(true);
      try {
        const { data, error } = await supabase.functions.invoke("reset-2fa", { body: { token } });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResetDone(true);
        toast.success("Tweestapsverificatie gereset. Log opnieuw in om opnieuw in te stellen.");
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setResetting(false);
      }
    })();
  }, [token]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAttempt(0);

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Vul een geldig e-mailadres in.");
      setLoading(false);
      return;
    }

    let lastErr: any = null;
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      setAttempt(i);
      try {
        const { data, error } = await supabase.functions.invoke("request-2fa-recovery", {
          body: { email: trimmed },
        });
        if (error) throw error;
        if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "Server error");
        setSent(true);
        setLoading(false);
        return;
      } catch (err: any) {
        lastErr = err;
        if (i < MAX_ATTEMPTS && isTransient(err)) {
          toast.message(`Verbinding hapert — opnieuw proberen (${i}/${MAX_ATTEMPTS})...`);
          await sleep(600 * 2 ** (i - 1)); // 600ms, 1.2s
          continue;
        }
        break;
      }
    }

    toast.error(friendlyMessage(lastErr));
    setLoading(false);
  };

  if (token) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader className="items-center">
            <AuthLogo />
            <CardTitle className="mt-4">{resetting ? "Bezig met resetten..." : resetDone ? "2FA gereset" : "Verwerken"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resetDone && <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />}
            <CardDescription>{resetDone ? "Je tweestapsverificatie is gereset. Log opnieuw in om een nieuwe authenticator in te stellen." : "Een moment geduld..."}</CardDescription>
            {resetDone && (
              <Button asChild className="w-full"><Link to="/login">Naar login</Link></Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <AuthLogo />
          <CardTitle className="mt-4">2FA herstellen</CardTitle>
          <CardDescription>We sturen een herstel-link naar je e-mailadres</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <Mail className="mx-auto h-10 w-10 text-primary" />
              <p className="text-sm text-muted-foreground">Als dit e-mailadres bekend is, ontvang je binnen enkele minuten een link om je tweestapsverificatie te resetten.</p>
              <Button asChild variant="outline" className="w-full"><Link to="/login">Terug naar login</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Versturen..." : "Stuur herstel-link"}</Button>
              <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">Terug naar login</Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
