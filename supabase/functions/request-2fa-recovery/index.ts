import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Extract a single, valid IP address from request headers, suitable for storing
 * in a Postgres `inet` column. Handles:
 *  - x-forwarded-for with multiple comma-separated IPs (client, proxy1, proxy2)
 *  - Multiple x-forwarded-for headers (joined by Headers API)
 *  - IPv4 addresses with optional port (1.2.3.4:5678)
 *  - IPv6 addresses with optional brackets and port ([::1]:443)
 *  - Fallbacks: x-real-ip, cf-connecting-ip
 *  - Returns null if nothing parseable is found
 */
function extractClientIp(req: Request): string | null {
  const candidates = [
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip"),
    req.headers.get("cf-connecting-ip"),
  ];

  const ipv4Re = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  // Loose IPv6 check: at least one ":" and only hex / ":" / "."
  const ipv6Re = /^[0-9a-fA-F:.]+$/;

  for (const raw of candidates) {
    if (!raw) continue;
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      let ip = part;

      // Bracketed IPv6 with optional port: [::1]:443
      if (ip.startsWith("[")) {
        const close = ip.indexOf("]");
        if (close > 0) ip = ip.substring(1, close);
      } else if (ip.includes(":")) {
        // If there's exactly one colon, treat as IPv4:port and strip the port.
        // If there are multiple colons, treat as bare IPv6 (no port).
        const firstColon = ip.indexOf(":");
        const lastColon = ip.lastIndexOf(":");
        if (firstColon === lastColon) {
          ip = ip.substring(0, firstColon);
        }
      }

      ip = ip.trim();
      if (!ip) continue;

      if (ipv4Re.test(ip)) {
        const octetsValid = ip.split(".").every((o) => Number(o) >= 0 && Number(o) <= 255);
        if (octetsValid) return ip;
      } else if (ip.includes(":") && ipv6Re.test(ip)) {
        return ip;
      }
    }
  }

  return null;
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
