import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthLogo } from "@/components/AuthLogo";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);

  useEffect(() => {
    const enroll = async () => {
      try {
        // Clean up any existing unverified factors
        const { data: existing } = await supabase.auth.mfa.listFactors();
        if (existing) {
          for (const f of existing.totp ?? []) {
            if ((f.status as string) !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
        }
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Cashmaatje ${Date.now()}` });
        if (error) throw error;
        setFactorId(data.id);
        setSecret(data.totp.secret);

        // Rewrite the otpauth:// URI so authenticator apps show "Cashmaatje" instead of the default issuer
        const brandedUri = rebrandTotpUri(data.totp.uri, "Cashmaatje", user?.email);
        const url = await QRCode.toDataURL(brandedUri, { width: 240, margin: 1, color: { dark: "#0a0a0a", light: "#ffffff" } });
        setQrDataUrl(url);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setEnrolling(false);
      }
    };
    enroll();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
      if (vErr) throw vErr;

      if (user?.id) {
        await supabase.from("user_2fa_settings").update({
          is_enabled: true,
          enabled_at: new Date().toISOString(),
          last_verified_at: new Date().toISOString(),
        }).eq("user_id", user.id);
      }

      toast.success("Tweestapsverificatie ingeschakeld");
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <AuthLogo />
          <div className="mt-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Tweestapsverificatie instellen</CardTitle>
          </div>
          <CardDescription>Scan de QR-code met je authenticator app (Google Authenticator, Authy, 1Password)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {enrolling ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="flex justify-center">
                {qrDataUrl && <img src={qrDataUrl} alt="2FA QR code" className="rounded-lg border border-border bg-white p-2" />}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Of voer deze sleutel handmatig in:</Label>
                <code className="block rounded-md bg-secondary px-3 py-2 text-center text-sm font-mono break-all">{secret}</code>
              </div>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">6-cijferige code uit je app</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                  {loading ? "Verifiëren..." : "Activeren"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
