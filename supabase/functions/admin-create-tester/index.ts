// Edge function: super-admin creates a tester account + (optional) tester org with seed data.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, service);
    const { data: roleCheck } = await admin
      .from("platform_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      email,
      password,
      full_name,
      org_name,
      seed_demo_data: seedDemo = false,
    } = body ?? {};

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create or fetch user
    let userId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? "" },
    });
    if (createErr) {
      // User might already exist — try to find them
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) throw createErr;
      userId = existing.id;
    } else {
      userId = created.user.id;
    }

    // 2. Create org (with full seed)
    const orgClient = createClient(url, service);
    const { data: orgIdResp, error: orgErr } = await orgClient.rpc("setup_new_organization", {
      p_user_id: userId,
      p_name: org_name || `${full_name || email.split("@")[0]} Tester`,
    });
    if (orgErr) throw orgErr;
    const orgId = orgIdResp as string;

    // 3. Mark as tester (paywall bypass)
    await admin.from("organizations").update({ is_tester: true }).eq("id", orgId);

    // 4. Optional: seed demo data
    if (seedDemo) {
      // run as the new user via service role (function checks auth.uid in normal use,
      // so we set via update rather than RPC which requires auth.uid())
      // Easiest: use service role to call an SQL function context-free seed.
      try { await admin.rpc("seed_demo_data", { p_org_id: orgId }); } catch (_) { /* ignore — needs auth.uid */ }
    }

    // 5. Send credentials email to the tester
    let emailSent = false;
    let emailError: string | null = null;
    try {
      const origin = req.headers.get("origin") ?? "https://cashmaatje.com";
      const { error: sendErr } = await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "tester-credentials",
          recipientEmail: email,
          idempotencyKey: `tester-credentials-${userId}`,
          templateData: {
            name: full_name ?? "",
            email,
            password,
            loginUrl: `${origin}/login`,
          },
        },
      });
      if (sendErr) throw sendErr;
      emailSent = true;
    } catch (e: any) {
      emailError = e?.message ?? String(e);
      console.error("send tester credentials email failed", emailError);
    }

    return new Response(JSON.stringify({
      user_id: userId,
      organization_id: orgId,
      email, password,
      email_sent: emailSent,
      email_error: emailError,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
