import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv } from "../_shared/stripe.ts";
import { recalcAndSyncForOrg } from "../_shared/referral-discount.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { organization_id, environment } = await req.json();
    if (!organization_id) throw new Error("organization_id is required");
    const env: StripeEnv = environment === "live" ? "live" : "sandbox";

    // Auth check — gebruiker moet lid zijn van deze org
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    const { data: membership } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .maybeSingle();
    if (!membership) throw new Error("Not a member of this organisation");

    const calc = await recalcAndSyncForOrg({
      admin,
      env,
      organizationId: organization_id,
      reason: "manual_recalc",
    });

    return new Response(JSON.stringify({ ok: true, calc }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("recalc error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
