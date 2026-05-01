import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabase: any = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ENTITY_ADDON_PRICE_ID = "entity_addon_monthly";

interface EntityDraft {
  name: string;
  legal_name?: string;
  org_type?: string;
  kvk_number?: string;
  btw_number?: string;
  ownership_pct?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const body = await req.json();
    const { parentOrganizationId, entityDraft, environment, returnUrl } = body as {
      parentOrganizationId: string;
      entityDraft: EntityDraft;
      environment: string;
      returnUrl: string;
    };

    if (!parentOrganizationId || !entityDraft?.name || !returnUrl) {
      throw new Error("parentOrganizationId, entityDraft.name and returnUrl are required");
    }
    const env: StripeEnv = environment === "live" ? "live" : "sandbox";

    // Auth
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Membership + owner check
    const { data: member } = await supabase
      .from("organization_members")
      .select("is_owner, role")
      .eq("organization_id", parentOrganizationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member?.is_owner) throw new Error("Only the owner can add entities");

    const stripe = createStripeClient(env);

    // Resolve price
    const prices = await stripe.prices.list({ limit: 100, active: true });
    const stripePrice = prices.data.find(
      (p: any) => p.metadata?.lovable_external_id === ENTITY_ADDON_PRICE_ID
    );
    if (!stripePrice) throw new Error(`Price not found: ${ENTITY_ADDON_PRICE_ID}`);

    // Reuse existing customer
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let customerId: string | undefined = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const draftJson = JSON.stringify({
      name: entityDraft.name,
      legal_name: entityDraft.legal_name ?? "",
      org_type: entityDraft.org_type ?? "bv",
      kvk_number: entityDraft.kvk_number ?? "",
      btw_number: entityDraft.btw_number ?? "",
      ownership_pct: entityDraft.ownership_pct ?? 100,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "subscription",
      ui_mode: "embedded",
      return_url: returnUrl,
      metadata: {
        userId: user.id,
        addon_type: "entity",
        parentOrgId: parentOrganizationId,
        entityDraft: draftJson,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          addon_type: "entity",
          parentOrgId: parentOrganizationId,
          entityDraft: draftJson,
        },
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("create-entity-checkout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
