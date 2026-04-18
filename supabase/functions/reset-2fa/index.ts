import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "token vereist" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const tokenHash = await sha256(token);

    const { data: request, error: lookupErr } = await admin
      .from("two_factor_recovery_requests")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (lookupErr) throw lookupErr;
    if (!request) {
      return new Response(JSON.stringify({ error: "Ongeldige of verlopen token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (request.used_at) {
      return new Response(JSON.stringify({ error: "Token al gebruikt" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (new Date(request.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token verlopen" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Unenroll all MFA factors for this user
    const { data: factorsData } = await admin.auth.admin.mfa.listFactors({ userId: request.user_id });
    if (factorsData) {
      for (const f of factorsData.factors ?? []) {
        await admin.auth.admin.mfa.deleteFactor({ userId: request.user_id, id: f.id });
      }
    }

    // Reset 2fa settings — restart grace period
    await admin.from("user_2fa_settings").update({
      is_enabled: false,
      enabled_at: null,
      grace_period_start: new Date().toISOString(),
    }).eq("user_id", request.user_id);

    // Mark token used
    await admin.from("two_factor_recovery_requests").update({ used_at: new Date().toISOString() }).eq("id", request.id);

    // Issue a magic link so user can sign in fresh and re-enroll
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: request.email,
    });

    return new Response(JSON.stringify({ success: true, action_link: linkData?.properties?.action_link ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[reset-2fa]", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
