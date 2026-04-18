import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthLogo } from "@/components/AuthLogo";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState<string>("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !data?.totp?.length) {
        navigate("/2fa/setup", { replace: true });
        return;
      }
      const verified = data.totp.find((f) => f.status === "verified");
      if (!verified) {
        navigate("/2fa/setup", { replace: true });
        return;
      }
      setFactorId(verified.id);
    })();
  }, [navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
      if (vErr) throw vErr;
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <AuthLogo />
          <div className="mt-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Verificatie vereist</CardTitle>
          </div>
          <CardDescription>Voer de code uit je authenticator app in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">6-cijferige code</Label>
              <Input
                id="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                className="text-center text-lg tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? "Verifiëren..." : "Verifiëren"}
            </Button>
            <Link to="/2fa/recovery" className="block text-center text-sm text-muted-foreground hover:text-foreground">
              Geen toegang tot je authenticator?
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
