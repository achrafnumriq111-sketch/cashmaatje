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
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email vereist" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Find user by email
    const { data: usersList, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw listErr;
    const user = usersList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    // Always return success to prevent enumeration
    if (!user) {
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate token
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    const { error: insErr } = await admin.from("two_factor_recovery_requests").insert({
      user_id: user.id,
      email: user.email!,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
      user_agent: req.headers.get("user-agent") ?? null,
    });
    if (insErr) throw insErr;

    // Build recovery URL — frontend page handles the reset
    const origin = req.headers.get("origin") ?? Deno.env.get("SUPABASE_URL")!;
    const recoveryUrl = `${origin}/2fa/recovery?token=${token}`;

    // Send email via Lovable AI Gateway (using simple HTML email through auth admin)
    // For now, use a magic link as the carrier — the link goes to /2fa/recovery
    // In production, integrate with auth-email-hook or transactional email
    console.log(`[2FA Recovery] Token for ${email}: ${recoveryUrl}`);

    // Use Supabase admin to send a custom email via the auth recovery flow as carrier
    // We'll embed our own token in the redirectTo
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email!,
      options: { redirectTo: recoveryUrl },
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[request-2fa-recovery]", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
