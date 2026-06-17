// supabase/functions/create-invoice-payment-link/index.ts
// Creates a Stripe Checkout Session for a single sales invoice.
// Returns { url } that the user can include in the invoice email / PDF.
// Stripe webhook (checkout.session.completed) marks the invoice as paid.

import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, serviceKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { invoice_id, environment, return_url } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const env: StripeEnv = environment === "live" ? "live" : "sandbox";

    const svc = createClient(supabaseUrl, serviceKey);

    const { data: invoice } = await svc.from("invoices").select("*").eq("id", invoice_id).single();
    if (!invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (invoice.invoice_type !== "sales") {
      return new Response(JSON.stringify({ error: "Payment links only for sales invoices" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Membership
    const { data: member } = await svc.from("organization_members")
      .select("user_id").eq("organization_id", invoice.organization_id).eq("user_id", user.id).maybeSingle();
    if (!member) {
      return new Response(JSON.stringify({ error: "Not a member" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (invoice.payment_link_url) {
      return new Response(JSON.stringify({ url: invoice.payment_link_url, reused: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountCents = Math.round(Number(invoice.total_amount) * 100);
    if (amountCents < 50) {
      return new Response(JSON.stringify({ error: "Bedrag te laag (min €0,50)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripe = createStripeClient(env);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "ideal"],
      line_items: [{
        price_data: {
          currency: (invoice.currency || "eur").toLowerCase(),
          product_data: { name: `Factuur ${invoice.invoice_number}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: return_url ? `${return_url}?invoice=${invoice.id}&status=paid` : `https://cashmaatje.com/?invoice=${invoice.id}&status=paid`,
      cancel_url: return_url ? `${return_url}?invoice=${invoice.id}&status=cancelled` : `https://cashmaatje.com/?invoice=${invoice.id}&status=cancelled`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        organization_id: invoice.organization_id,
      },
      payment_intent_data: {
        description: `Factuur ${invoice.invoice_number}`,
        metadata: { invoice_id: invoice.id },
      },
    });

    await svc.from("invoices").update({
      payment_link_url: session.url,
      payment_link_provider: "stripe",
      payment_link_session_id: session.id,
    }).eq("id", invoice.id);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-invoice-payment-link error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
