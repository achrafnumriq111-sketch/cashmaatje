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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { priceId, environment, returnUrl } = await req.json();
    if (!priceId || !returnUrl) throw new Error("priceId and returnUrl are required");
    const env: StripeEnv = environment === "live" ? "live" : "sandbox";

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const stripe = createStripeClient(env);

    // Resolve human-readable price ID -> Stripe price object
    const prices = await stripe.prices.list({ limit: 100, active: true });
    const stripePrice = prices.data.find(
      (p: any) => p.metadata?.lovable_external_id === priceId
    );
    if (!stripePrice) throw new Error(`Price not found: ${priceId}`);

    // Reuse existing customer if subscription exists
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, status")
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

    // Eerste maand gratis: alleen voor users die nog NOOIT een subscription hadden
    // (voorkomt misbruik door uit/in te loggen of opnieuw te subscriben).
    const { count: priorCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("environment", env);
    const isFirstTime = !priorCount || priorCount === 0;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "subscription",
      ui_mode: "embedded",
      return_url: returnUrl,
      metadata: { userId: user.id, first_month_free: isFirstTime ? "true" : "false" },
      subscription_data: {
        metadata: { userId: user.id },
        ...(isFirstTime && { trial_period_days: 30 }),
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("create-checkout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
